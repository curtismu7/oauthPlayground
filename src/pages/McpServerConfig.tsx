import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { apiKeyService } from '../services/apiKeyService';

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

interface ToolParam {
	name: string;
	type: 'string' | 'number' | 'boolean';
	optional: boolean;
	description: string;
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
	{
		name: 'pingone_update_application',
		category: 'Worker & Apps',
		description: 'Update an existing application (PATCH)',
	},
	{
		name: 'pingone_delete_application',
		category: 'Worker & Apps',
		description: 'Delete an application',
	},
	{
		name: 'pingone_get_application_secret',
		category: 'Worker & Apps',
		description: 'Retrieve the current client secret',
	},
	{
		name: 'pingone_rotate_application_secret',
		category: 'Worker & Apps',
		description: 'Rotate (regenerate) the client secret',
	},
	// Users
	{ name: 'pingone_get_user', category: 'Users', description: 'Get a user by ID' },
	{
		name: 'pingone_list_users',
		category: 'Users',
		description: 'List users (supports SCIM filter)',
	},
	{
		name: 'pingone_get_user_groups',
		category: 'Users',
		description: 'Get all groups a user belongs to',
	},
	{
		name: 'pingone_get_user_roles',
		category: 'Users',
		description: 'Get role assignments for a user',
	},
	{
		name: 'pingone_lookup_users',
		category: 'Users',
		description: 'Look up users by UUID, username, or email',
	},
	{ name: 'pingone_get_population', category: 'Users', description: 'Get a population by ID' },
	{
		name: 'pingone_list_populations',
		category: 'Users',
		description: 'List all populations in the environment',
	},
	{
		name: 'pingone_get_user_consents',
		category: 'Users',
		description: 'Get consent records for a user',
	},
	{
		name: 'pingone_create_user',
		category: 'Users',
		description: 'Create a new user in the directory',
	},
	{
		name: 'pingone_update_user',
		category: 'Users',
		description: 'Update an existing user (PATCH)',
	},
	{ name: 'pingone_delete_user', category: 'Users', description: 'Permanently delete a user' },
	{ name: 'pingone_add_user_to_group', category: 'Users', description: 'Add a user to a group' },
	{
		name: 'pingone_remove_user_from_group',
		category: 'Users',
		description: 'Remove a user from a group',
	},
	// Groups
	{
		name: 'pingone_list_groups',
		category: 'Groups',
		description: 'List all groups in the environment',
	},
	{ name: 'pingone_get_group', category: 'Groups', description: 'Get a group by ID' },
	{ name: 'pingone_create_group', category: 'Groups', description: 'Create a new group' },
	{ name: 'pingone_update_group', category: 'Groups', description: 'Update a group' },
	{ name: 'pingone_delete_group', category: 'Groups', description: 'Delete a group' },
	// MFA
	{
		name: 'pingone.mfa.devices.list',
		category: 'MFA',
		description: 'List MFA devices registered for a user',
	},
	{
		name: 'pingone.mfa.devices.register',
		category: 'MFA',
		description: 'Register a new MFA device',
	},
	{
		name: 'pingone.mfa.devices.activate',
		category: 'MFA',
		description: 'Activate a device using an OTP code',
	},
	{ name: 'pingone.mfa.challenge.send', category: 'MFA', description: 'Initiate an MFA challenge' },
	{
		name: 'pingone.mfa.challenge.validate',
		category: 'MFA',
		description: 'Validate a challenge response',
	},
	{ name: 'pingone.mfa.devices.delete', category: 'MFA', description: 'Delete an MFA device' },
	{
		name: 'pingone.mfa.devices.block',
		category: 'MFA',
		description: 'Administratively block an MFA device',
	},
	{
		name: 'pingone.mfa.devices.unlock',
		category: 'MFA',
		description: 'Unlock a device locked by failed attempts',
	},
	{
		name: 'pingone.mfa.devices.unblock',
		category: 'MFA',
		description: 'Unblock an administratively blocked device',
	},
	{
		name: 'pingone.mfa.devices.nickname',
		category: 'MFA',
		description: 'Update display nickname for a device',
	},
	{
		name: 'pingone.mfa.devices.otp',
		category: 'MFA',
		description: 'Send an OTP to a device (SMS/EMAIL/VOICE)',
	},
	{
		name: 'pingone.mfa.devices.reorder',
		category: 'MFA',
		description: 'Set preferred device order for a user',
	},
	{
		name: 'pingone.mfa.devices.reorder.remove',
		category: 'MFA',
		description: 'Remove custom device ordering',
	},
	{
		name: 'pingone.mfa.policy.list',
		category: 'MFA',
		description: 'List MFA device authentication policies',
	},
	{
		name: 'pingone.mfa.policy.get',
		category: 'MFA',
		description: 'Get a specific MFA policy by ID',
	},
	{ name: 'pingone.mfa.policy.create', category: 'MFA', description: 'Create a new MFA policy' },
	{
		name: 'pingone.mfa.policy.update',
		category: 'MFA',
		description: 'Update an MFA policy (full PUT)',
	},
	{
		name: 'pingone.mfa.bypass.allow',
		category: 'MFA',
		description: 'Enable MFA bypass for a user',
	},
	{
		name: 'pingone.mfa.bypass.check',
		category: 'MFA',
		description: 'Check current MFA bypass status for a user',
	},
	// Introspect
	{
		name: 'pingone_introspect_token',
		category: 'Tokens',
		description: 'Introspect a token (RFC 7662) — active status, claims, expiry',
	},
	// Phase 7
	{
		name: 'pingone_password_state',
		category: 'Tokens',
		description: 'Get password state for a user',
	},
	{
		name: 'pingone_password_send_recovery_code',
		category: 'Tokens',
		description: 'Send a password recovery code to a user',
	},
	{
		name: 'pingone_token_exchange',
		category: 'Tokens',
		description: 'Exchange an authorization code for tokens',
	},
	{
		name: 'pingone_userinfo',
		category: 'Tokens',
		description: 'Fetch UserInfo claims using an access token',
	},
	{
		name: 'pingone_check_username_password',
		category: 'Tokens',
		description: 'Check if a username/password combination is valid',
	},
	{
		name: 'pingone_risk_evaluation',
		category: 'Tokens',
		description: 'Trigger a risk evaluation for a user/session',
	},
	// Redirectless
	{
		name: 'pingone.redirectless.start',
		category: 'Redirectless',
		description: 'Start a redirectless (API-first) authentication flow',
	},
	{
		name: 'pingone.redirectless.poll',
		category: 'Redirectless',
		description: 'Poll a redirectless resume URL',
	},
	{
		name: 'pingone.redirectless.complete',
		category: 'Redirectless',
		description: 'Complete a redirectless auth flow',
	},
	// Device Auth
	{
		name: 'pingone_device_authorization',
		category: 'Device Auth',
		description: 'Initiate the OAuth Device Authorization flow (RFC 8628)',
	},
	// Subscriptions
	{
		name: 'pingone_list_subscriptions',
		category: 'Subscriptions',
		description: 'List webhook subscriptions',
	},
	{
		name: 'pingone_get_subscription',
		category: 'Subscriptions',
		description: 'Get a subscription by ID',
	},
	{
		name: 'pingone_create_subscription',
		category: 'Subscriptions',
		description: 'Create a new webhook subscription',
	},
	{
		name: 'pingone_update_subscription',
		category: 'Subscriptions',
		description: 'Update a subscription',
	},
	{
		name: 'pingone_delete_subscription',
		category: 'Subscriptions',
		description: 'Delete a subscription',
	},
	// Licensing
	{
		name: 'pingone_get_organization_licenses',
		category: 'Admin',
		description: 'Get organization license information',
	},
	// Training
	{
		name: 'pingone-training.overview',
		category: 'Training',
		description: 'Training overview module',
	},
	{
		name: 'pingone-training.auth-flow',
		category: 'Training',
		description: 'Auth flow training lesson',
	},
	{
		name: 'pingone-training.worker-token',
		category: 'Training',
		description: 'Worker token training lesson',
	},
	{
		name: 'pingone-training.mfa-redirectless',
		category: 'Training',
		description: 'MFA redirectless training lesson',
	},
	{
		name: 'pingone.training.lesson',
		category: 'Training',
		description: 'Retrieve a specific training lesson',
	},
	{
		name: 'pingone.training.practice-auth',
		category: 'Training',
		description: 'Practice auth scenario',
	},
	{
		name: 'pingone.training.practice-worker-token',
		category: 'Training',
		description: 'Practice worker token scenario',
	},
];

const CATEGORIES = ['All', ...Array.from(new Set(TOOL_CATALOG.map((t) => t.category)))];

const CATEGORY_COLORS: Record<string, string> = {
	Auth: '#3b82f6',
	OIDC: '#8b5cf6',
	'Worker & Apps': '#6366f1',
	Users: '#10b981',
	Groups: '#14b8a6',
	MFA: '#f59e0b',
	Tokens: '#ef4444',
	Redirectless: '#ec4899',
	'Device Auth': '#f97316',
	Subscriptions: '#06b6d4',
	Admin: '#64748b',
	Training: '#84cc16',
};

// ─── Styled Components ────────────────────────────────────────────────────────

const Page = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px 60px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const PageHeader = styled.div`
  margin-bottom: 28px;
`;

const PageTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 6px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PageSubtitle = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
`;

const TabBar = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 28px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  background: none;
  cursor: pointer;
  color: ${(p) => (p.$active ? '#6366f1' : '#64748b')};
  border-bottom: 2px solid ${(p) => (p.$active ? '#6366f1' : 'transparent')};
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;
  &:hover { color: #6366f1; }
`;

const Card = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
`;

const CardTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const StatusBadge = styled.span<{ $ok: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
  background: ${(p) => (p.$ok ? '#dcfce7' : '#fee2e2')};
  color: ${(p) => (p.$ok ? '#166534' : '#991b1b')};
`;

const Dot = styled.span<{ $ok: boolean }>`
  width: 8px; height: 8px;
  border-radius: 50%;
  background: ${(p) => (p.$ok ? '#22c55e' : '#ef4444')};
  display: inline-block;
`;

const InfoPill = styled.span`
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 3px 10px;
  border-radius: 12px;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
`;

const Btn = styled.button<{ $variant?: 'primary' | 'danger' | 'success' | 'default' }>`
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  ${(p) => {
		switch (p.$variant) {
			case 'primary':
				return 'background:#6366f1; color:white;';
			case 'danger':
				return 'background:#ef4444; color:white;';
			case 'success':
				return 'background:#10b981; color:white;';
			default:
				return 'background:#ffffff; color:#2563eb; border:1px solid #3b82f6; &:hover { background:#f8fafc; border-color:#2563eb; color:#1d4ed8; }';
		}
	}}
`;

const LogBox = styled.pre`
  background: #0f172a;
  color: #a3e635;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 12px;
  padding: 14px;
  border-radius: 10px;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 14px;
  white-space: pre-wrap;
  word-break: break-word;
`;

const CheckRow = styled.div<{ $ok: boolean; $warn?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: ${(p) => (p.$ok ? '#166534' : p.$warn ? '#92400e' : '#991b1b')};
  margin-bottom: 8px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const FormInput = styled.input`
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  &:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
`;

const FormHint = styled.p`
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
`;

const SaveBtn = styled(Btn)`
  margin-top: 20px;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 9px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  &:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
`;

const CategorySelect = styled.select`
  padding: 9px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  &:focus { outline: none; border-color: #6366f1; }
`;

const ToolCount = styled.span`
  font-size: 13px;
  color: #94a3b8;
  align-self: center;
`;

const ToolTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px;
  border-bottom: 2px solid #e2e8f0;
`;

const Tr = styled.tr`
  &:hover { background: #f8fafc; }
`;

const Td = styled.td`
  padding: 10px 12px;
  font-size: 13px;
  color: #374151;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
`;

const CategoryBadge = styled.span<{ $color: string }>`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${(p) => p.$color}22;
  color: ${(p) => p.$color};
  white-space: nowrap;
`;

const ToolName = styled.code`
  font-size: 12px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  color: #4f46e5;
  font-weight: 600;
  background: #eef2ff;
  padding: 2px 6px;
  border-radius: 4px;
`;

const CodeBlock = styled.pre`
  background: #0f172a;
  color: #e2e8f0;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 13px;
  padding: 18px;
  border-radius: 10px;
  overflow-x: auto;
  line-height: 1.6;
  position: relative;
  margin: 0;
`;

const CopyBtn = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 12px;
  padding: 4px 10px;
  background: #334155;
  color: #e2e8f0;
  border: 1px solid #475569;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: #475569; }
`;

const AddToolGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const ParamRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 100px 80px auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
`;

const RemoveBtn = styled.button`
  padding: 4px 8px;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
`;

const AddParamBtn = styled.button`
  padding: 6px 14px;
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #64748b;
  &:hover { background: #e2e8f0; }
`;

const Alert = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 14px;
  ${(p) => {
		switch (p.$type) {
			case 'success':
				return 'background:#dcfce7; color:#166534; border:1px solid #bbf7d0;';
			case 'error':
				return 'background:#fee2e2; color:#991b1b; border:1px solid #fecaca;';
			default:
				return 'background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;';
		}
	}}
`;

const Select = styled.select`
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  background: white;
`;

const Checkbox = styled.input`
  width: 16px; height: 16px;
`;

// ─── Component ────────────────────────────────────────────────────────────────

const McpServerConfig: React.FC = () => {
	const [activeTab, setActiveTab] = useState<
		'status' | 'credentials' | 'tools' | 'connect' | 'add-tool'
	>('status');

	// Status
	const [status, setStatus] = useState<ServerStatus | null>(null);
	const [statusLoading, setStatusLoading] = useState(false);
	const [buildLog, setBuildLog] = useState('');
	const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
		null
	);

	// Credentials
	const [creds, setCreds] = useState<McpCredentials>({});
	const [credsMsg, setCredsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
		null
	);
	const [showSecret, setShowSecret] = useState(false);

	// Groq API key
	const [groqKey, setGroqKey] = useState('');
	const [showGroqKey, setShowGroqKey] = useState(false);
	const [groqMsg, setGroqMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

	// Tools
	const [search, setSearch] = useState('');
	const [category, setCategory] = useState('All');

	// Add Tool
	const [newTool, setNewTool] = useState({
		toolId: '',
		description: '',
		method: 'GET',
		apiPath: '',
	});
	const [toolParams, setToolParams] = useState<ToolParam[]>([]);
	const [addToolMsg, setAddToolMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
		null
	);
	const [addedCode, setAddedCode] = useState('');

	const fetchStatus = useCallback(async () => {
		setStatusLoading(true);
		try {
			const r = await fetch('/api/mcp/server/status');
			const d = (await r.json()) as ServerStatus;
			setStatus(d);
		} catch {
			// network error; keep last status
		} finally {
			setStatusLoading(false);
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
		try {
			const stored = await apiKeyService.getApiKey('groq');
			if (stored) setGroqKey(stored);
		} catch {
			/* ignore */
		}
	}, []);

	useEffect(() => {
		void fetchStatus();
		void fetchCreds();
		const id = setInterval(() => void fetchStatus(), 8000);
		return () => clearInterval(id);
	}, [fetchStatus, fetchCreds]);

	const serverAction = useCallback(
		async (endpoint: string, label: string) => {
			setActionMsg(null);
			setBuildLog('');
			try {
				const r = await fetch(`/api/mcp/server/${endpoint}`, { method: 'POST' });
				const d = (await r.json()) as {
					success: boolean;
					output?: string;
					error?: string;
					pid?: number;
					already_running?: boolean;
					was_already_stopped?: boolean;
				};
				if (d.output) setBuildLog(d.output);
				if (d.success) {
					const detail = d.pid
						? ` (PID ${d.pid})`
						: d.already_running
							? ' (already running)'
							: d.was_already_stopped
								? ' (already stopped)'
								: '';
					setActionMsg({ type: 'success', text: `${label} succeeded${detail}` });
				} else {
					setActionMsg({ type: 'error', text: d.error ?? `${label} failed` });
				}
			} catch (e) {
				setActionMsg({ type: 'error', text: e instanceof Error ? e.message : String(e) });
			}
			await fetchStatus();
		},
		[fetchStatus]
	);

	const saveCreds = async () => {
		setCredsMsg(null);
		try {
			const r = await fetch('/api/mcp/server/credentials', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(creds),
			});
			const d = (await r.json()) as { success: boolean; error?: string };
			if (d.success) {
				setCredsMsg({
					type: 'success',
					text: 'Credentials saved to ~/.pingone-playground/credentials/mcp-config.json. Restart the MCP server to pick them up.',
				});
			} else {
				setCredsMsg({ type: 'error', text: d.error ?? 'Save failed' });
			}
		} catch (e) {
			setCredsMsg({ type: 'error', text: e instanceof Error ? e.message : String(e) });
		}
		await fetchStatus();
	};

	const saveGroqKey = async () => {
		setGroqMsg(null);
		if (!groqKey.trim()) {
			setGroqMsg({ type: 'error', text: 'Please enter a Groq API key.' });
			return;
		}
		try {
			// Store via apiKeyService — persists to unifiedTokenStorage + syncs to backend
			await apiKeyService.storeApiKey('groq', groqKey.trim());
			setGroqMsg({
				type: 'success',
				text: '✅ Groq API key saved. The AI Assistant will now use Groq (Llama 3.3 70B) for responses.',
			});
		} catch (e) {
			setGroqMsg({ type: 'error', text: e instanceof Error ? e.message : String(e) });
		}
	};

	const addTool = async () => {
		setAddToolMsg(null);
		setAddedCode('');
		try {
			const r = await fetch('/api/mcp/server/add-tool', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...newTool, params: toolParams }),
			});
			const d = (await r.json()) as {
				success: boolean;
				fileName?: string;
				code?: string;
				error?: string;
			};
			if (d.success) {
				setAddToolMsg({
					type: 'success',
					text: `Created ${d.fileName ?? 'file'} and wired into index.ts. Run Build + Restart to activate.`,
				});
				setAddedCode(d.code ?? '');
				setNewTool({ toolId: '', description: '', method: 'GET', apiPath: '' });
				setToolParams([]);
			} else {
				setAddToolMsg({ type: 'error', text: d.error ?? 'Failed to add tool' });
			}
		} catch (e) {
			setAddToolMsg({ type: 'error', text: e instanceof Error ? e.message : String(e) });
		}
	};

	const copy = (text: string) => {
		void navigator.clipboard.writeText(text);
	};

	const filteredTools = TOOL_CATALOG.filter((t) => {
		const matchCat = category === 'All' || t.category === category;
		const q = search.toLowerCase();
		const matchSearch =
			!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
		return matchCat && matchSearch;
	});

	const mcpServerPath = '/Users/cmuir/P1Import-apps/oauth-playground/pingone-mcp-server';
	const claudeConfigJson = JSON.stringify(
		{
			mcpServers: {
				'pingone-mcp-server': {
					command: 'node',
					args: [`${mcpServerPath}/dist/index.js`],
					env: {
						PINGONE_ENVIRONMENT_ID: creds.environmentId ?? '<your-env-id>',
						PINGONE_CLIENT_ID: creds.clientId ?? '<your-client-id>',
						PINGONE_CLIENT_SECRET: creds.clientSecret ? '(saved)' : '<your-client-secret>',
					},
				},
			},
		},
		null,
		2
	);

	return (
		<Page>
			<PageHeader>
				<PageTitle>🔌 MCP Server Configuration</PageTitle>
				<PageSubtitle>
					Manage the <strong>pingone-mcp-server</strong> — {TOOL_CATALOG.length} tools exposing
					PingOne APIs via Model Context Protocol.
				</PageSubtitle>
			</PageHeader>

			<TabBar>
				{(['status', 'credentials', 'tools', 'connect', 'add-tool'] as const).map((t) => (
					<Tab key={t} $active={activeTab === t} onClick={() => setActiveTab(t)}>
						{
							{
								status: '🟢 Status',
								credentials: '🔑 Credentials',
								tools: '🧰 Tools',
								connect: '🔌 Connect',
								'add-tool': '➕ Add Tool',
							}[t]
						}
					</Tab>
				))}
			</TabBar>

			{/* ── STATUS TAB ─────────────────────────────────────────────── */}
			{activeTab === 'status' && (
				<>
					<Card>
						<CardTitle>
							Server Status{' '}
							{statusLoading && (
								<span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>refreshing…</span>
							)}
						</CardTitle>
						{status ? (
							<>
								<StatusRow>
									<StatusBadge $ok={status.running}>
										<Dot $ok={status.running} />
										{status.running ? `Running (PID ${status.pid})` : 'Stopped'}
									</StatusBadge>
									<InfoPill>v{status.version}</InfoPill>
									<InfoPill>stdio transport</InfoPill>
									{status.environmentId && <InfoPill>Env: {status.environmentId}</InfoPill>}
								</StatusRow>
								<CheckRow $ok={status.distExists}>
									{status.distExists ? '✅' : '❌'} dist/index.js{' '}
									{status.distExists ? 'exists (built)' : 'missing — run Build first'}
								</CheckRow>
								<CheckRow $ok={status.configExists} $warn={!status.configExists}>
									{status.configExists ? '✅' : '⚠️'} mcp-config.json{' '}
									{status.configExists
										? 'found'
										: 'not found — set credentials in the Credentials tab'}
								</CheckRow>
								<CheckRow $ok={status.credentialsConfigured} $warn={!status.credentialsConfigured}>
									{status.credentialsConfigured ? '✅' : '⚠️'} PingOne credentials{' '}
									{status.credentialsConfigured
										? 'configured'
										: 'not configured (environmentId + clientId required)'}
								</CheckRow>
							</>
						) : (
							<p style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</p>
						)}

						<BtnRow>
							<Btn
								$variant="success"
								onClick={() => void serverAction('start', 'Start')}
								disabled={status?.running}
							>
								▶ Start
							</Btn>
							<Btn
								$variant="danger"
								onClick={() => void serverAction('stop', 'Stop')}
								disabled={!status?.running}
							>
								⏹ Stop
							</Btn>
							<Btn
								$variant="primary"
								onClick={() =>
									void Promise.all([serverAction('stop', 'Stop'), serverAction('start', 'Restart')])
								}
							>
								🔄 Restart
							</Btn>
							<Btn onClick={() => void serverAction('build', 'Build')} disabled={!status}>
								🔨 Build (tsc)
							</Btn>
							<Btn onClick={() => void fetchStatus()}>⟳ Refresh</Btn>
						</BtnRow>

						{actionMsg && <Alert $type={actionMsg.type}>{actionMsg.text}</Alert>}
						{buildLog && <LogBox>{buildLog}</LogBox>}
					</Card>

					<Card>
						<CardTitle>Quick Reference</CardTitle>
						<div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
							<p>
								<strong>Start manually:</strong>{' '}
								<code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
									cd pingone-mcp-server && npm run dev
								</code>
							</p>
							<p>
								<strong>Build:</strong>{' '}
								<code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
									cd pingone-mcp-server && npm run build
								</code>
							</p>
							<p>
								<strong>Credentials file:</strong>{' '}
								<code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
									~/.pingone-playground/credentials/mcp-config.json
								</code>
							</p>
							<p>
								<strong>Tools count:</strong> {TOOL_CATALOG.length} tools across{' '}
								{CATEGORIES.length - 1} categories
							</p>
						</div>
					</Card>
				</>
			)}

			{/* ── CREDENTIALS TAB ──────────────────────────────────────── */}
			{activeTab === 'credentials' && (
				<Card>
					<CardTitle>🔑 MCP Server Credentials</CardTitle>
					<p style={{ fontSize: 13, color: '#64748b', marginTop: -8, marginBottom: 20 }}>
						Saved to{' '}
						<code style={{ fontSize: 12 }}>~/.pingone-playground/credentials/mcp-config.json</code>.
						The MCP server reads these at startup via{' '}
						<code style={{ fontSize: 12 }}>loadCredentialsFromStorage()</code>. Restart the server
						after saving.
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
										color: '#64748b',
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
					<hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '28px 0 24px' }} />
					<CardTitle>⚡ Groq LLM API Key</CardTitle>
					<p style={{ fontSize: 13, color: '#64748b', marginTop: -8, marginBottom: 16 }}>
						Powers the AI Assistant with <strong>Llama 3.3 70B</strong> (free tier). Get a key at{' '}
						<a
							href="https://console.groq.com"
							target="_blank"
							rel="noopener noreferrer"
							style={{ color: '#6366f1' }}
						>
							console.groq.com
						</a>
						. Stored in server memory for this session only — never written to disk.
					</p>
					<FormGroup style={{ maxWidth: 480 }}>
						<FormLabel>Groq API Key</FormLabel>
						<div style={{ position: 'relative' }}>
							<FormInput
								type={showGroqKey ? 'text' : 'password'}
								value={groqKey}
								onChange={(e) => setGroqKey(e.target.value)}
								placeholder="gsk_…"
								style={{ width: '100%', boxSizing: 'border-box', paddingRight: 60 }}
							/>
							<button
								type="button"
								onClick={() => setShowGroqKey((s) => !s)}
								style={{
									position: 'absolute',
									right: 8,
									top: '50%',
									transform: 'translateY(-50%)',
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									color: '#64748b',
									fontSize: 13,
								}}
							>
								{showGroqKey ? 'Hide' : 'Show'}
							</button>
						</div>
						<FormHint>
							Starts with <code>gsk_</code> — session-only, not persisted to disk
						</FormHint>
					</FormGroup>
					<SaveBtn $variant="primary" onClick={() => void saveGroqKey()} style={{ marginTop: 12 }}>
						⚡ Save Groq Key
					</SaveBtn>
					{groqMsg && <Alert $type={groqMsg.type}>{groqMsg.text}</Alert>}{' '}
				</Card>
			)}

			{/* ── TOOLS TAB ─────────────────────────────────────────────── */}
			{activeTab === 'tools' && (
				<Card>
					<CardTitle>🧰 Tool Browser</CardTitle>
					<SearchRow>
						<SearchInput
							placeholder="Search tools…"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
						<CategorySelect value={category} onChange={(e) => setCategory(e.target.value)}>
							{CATEGORIES.map((c) => (
								<option key={c}>{c}</option>
							))}
						</CategorySelect>
						<ToolCount>
							{filteredTools.length} / {TOOL_CATALOG.length} tools
						</ToolCount>
					</SearchRow>
					<ToolTable>
						<thead>
							<tr>
								<Th>Tool ID</Th>
								<Th>Category</Th>
								<Th>Description</Th>
							</tr>
						</thead>
						<tbody>
							{filteredTools.map((t) => (
								<Tr key={t.name}>
									<Td>
										<ToolName>{t.name}</ToolName>
									</Td>
									<Td>
										<CategoryBadge $color={CATEGORY_COLORS[t.category] ?? '#64748b'}>
											{t.category}
										</CategoryBadge>
									</Td>
									<Td style={{ color: '#64748b' }}>{t.description}</Td>
								</Tr>
							))}
						</tbody>
					</ToolTable>
				</Card>
			)}

			{/* ── CONNECT TAB ───────────────────────────────────────────── */}
			{activeTab === 'connect' && (
				<>
					<Card>
						<CardTitle>Claude Desktop</CardTitle>
						<p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
							Add this to your{' '}
							<code style={{ fontSize: 12 }}>
								~/Library/Application Support/Claude/claude_desktop_config.json
							</code>
							. Make sure you have run <strong>Build</strong> first so{' '}
							<code style={{ fontSize: 12 }}>dist/index.js</code> exists.
						</p>
						<div style={{ position: 'relative' }}>
							<CodeBlock>{claudeConfigJson}</CodeBlock>
							<CopyBtn onClick={() => copy(claudeConfigJson)}>Copy</CopyBtn>
						</div>
					</Card>

					<Card>
						<CardTitle>MCP Inspector (test in browser)</CardTitle>
						<p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
							Run the MCP client inspector to test your server interactively:
						</p>
						<div style={{ position: 'relative' }}>
							<CodeBlock>{`npx @modelcontextprotocol/inspector node ${mcpServerPath}/dist/index.js`}</CodeBlock>
							<CopyBtn
								onClick={() =>
									copy(`npx @modelcontextprotocol/inspector node ${mcpServerPath}/dist/index.js`)
								}
							>
								Copy
							</CopyBtn>
						</div>
					</Card>

					<Card>
						<CardTitle>VS Code / Cursor / Windsurf</CardTitle>
						<p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
							Add to your editor's MCP settings (e.g.{' '}
							<code style={{ fontSize: 12 }}>.vscode/mcp.json</code> or editor settings):
						</p>
						<div style={{ position: 'relative' }}>
							<CodeBlock>
								{JSON.stringify(
									{
										servers: {
											'pingone-mcp-server': {
												type: 'stdio',
												command: 'node',
												args: [`${mcpServerPath}/dist/index.js`],
											},
										},
									},
									null,
									2
								)}
							</CodeBlock>
							<CopyBtn
								onClick={() =>
									copy(
										JSON.stringify(
											{
												servers: {
													'pingone-mcp-server': {
														type: 'stdio',
														command: 'node',
														args: [`${mcpServerPath}/dist/index.js`],
													},
												},
											},
											null,
											2
										)
									)
								}
							>
								Copy
							</CopyBtn>
						</div>
					</Card>

					<Card>
						<CardTitle>Useful Prompts</CardTitle>
						<p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
							Once connected to an MCP-capable AI, try these prompts:
						</p>
						{[
							'List all applications in my PingOne environment',
							'Show me the users in my environment',
							'Get the OIDC discovery document for my environment',
							'Get me a worker token',
							'List all MFA devices for user {userId}',
							'Create a user with username alice@example.com',
							'What groups exist in my PingOne environment?',
							'Rotate the client secret for application {appId}',
						].map((p) => (
							<div
								key={p}
								style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
							>
								<code
									style={{
										flex: 1,
										background: '#f8fafc',
										border: '1px solid #e2e8f0',
										padding: '6px 10px',
										borderRadius: 6,
										fontSize: 13,
										color: '#334155',
									}}
								>
									{p}
								</code>
								<Btn onClick={() => copy(p)} style={{ flexShrink: 0 }}>
									Copy
								</Btn>
							</div>
						))}
					</Card>
				</>
			)}

			{/* ── ADD TOOL TAB ──────────────────────────────────────────── */}
			{activeTab === 'add-tool' && (
				<Card>
					<CardTitle>➕ Add a Custom Tool</CardTitle>
					<p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
						Define a new MCP tool. The TypeScript file will be written to{' '}
						<code style={{ fontSize: 12 }}>pingone-mcp-server/src/actions/</code>, and the import +
						register call will be injected into <code style={{ fontSize: 12 }}>src/index.ts</code>{' '}
						automatically. Then run <strong>Build + Restart</strong> on the Status tab.
					</p>
					<AddToolGrid>
						<FormGroup>
							<FormLabel>
								Tool ID * <span style={{ fontWeight: 400, color: '#94a3b8' }}>(snake_case)</span>
							</FormLabel>
							<FormInput
								value={newTool.toolId}
								onChange={(e) =>
									setNewTool((t) => ({
										...t,
										toolId: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
									}))
								}
								placeholder="pingone_my_custom_tool"
							/>
						</FormGroup>
						<FormGroup>
							<FormLabel>Description *</FormLabel>
							<FormInput
								value={newTool.description}
								onChange={(e) => setNewTool((t) => ({ ...t, description: e.target.value }))}
								placeholder="What does this tool do?"
							/>
						</FormGroup>
						<FormGroup>
							<FormLabel>HTTP Method</FormLabel>
							<Select
								value={newTool.method}
								onChange={(e) => setNewTool((t) => ({ ...t, method: e.target.value }))}
							>
								{['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
									<option key={m}>{m}</option>
								))}
							</Select>
						</FormGroup>
						<FormGroup>
							<FormLabel>API Path</FormLabel>
							<FormInput
								value={newTool.apiPath}
								onChange={(e) => setNewTool((t) => ({ ...t, apiPath: e.target.value }))}
								placeholder="/environments/{envId}/resources/{id}"
							/>
						</FormGroup>
					</AddToolGrid>

					<div style={{ marginBottom: 16 }}>
						<FormLabel style={{ display: 'block', marginBottom: 8 }}>Parameters</FormLabel>
						{toolParams.map((p, i) => (
							<ParamRow key={i}>
								<FormInput
									value={p.name}
									onChange={(e) =>
										setToolParams((ps) =>
											ps.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
										)
									}
									placeholder="paramName"
									style={{ fontSize: 13, padding: '7px 10px' }}
								/>
								<Select
									value={p.type}
									onChange={(e) =>
										setToolParams((ps) =>
											ps.map((x, j) => (j === i ? { ...x, type: e.target.value as 'string' } : x))
										)
									}
								>
									<option>string</option>
									<option>number</option>
									<option>boolean</option>
								</Select>
								<label
									htmlFor={`param-optional-${i}`}
									style={{
										fontSize: 13,
										display: 'flex',
										alignItems: 'center',
										gap: 4,
										color: '#64748b',
									}}
								>
									<Checkbox
										id={`param-optional-${i}`}
										type="checkbox"
										checked={p.optional}
										onChange={(e) =>
											setToolParams((ps) =>
												ps.map((x, j) => (j === i ? { ...x, optional: e.target.checked } : x))
											)
										}
									/>
									Optional
								</label>
								<RemoveBtn onClick={() => setToolParams((ps) => ps.filter((_, j) => j !== i))}>
									✕
								</RemoveBtn>
							</ParamRow>
						))}
						<AddParamBtn
							onClick={() =>
								setToolParams((ps) => [
									...ps,
									{ name: '', type: 'string', optional: false, description: '' },
								])
							}
						>
							+ Add Parameter
						</AddParamBtn>
					</div>

					<BtnRow>
						<Btn
							$variant="primary"
							onClick={() => void addTool()}
							disabled={!newTool.toolId || !newTool.description}
						>
							🚀 Create Tool
						</Btn>
					</BtnRow>

					{addToolMsg && <Alert $type={addToolMsg.type}>{addToolMsg.text}</Alert>}
					{addedCode && (
						<div style={{ marginTop: 16 }}>
							<FormLabel style={{ display: 'block', marginBottom: 8 }}>Generated Code</FormLabel>
							<div style={{ position: 'relative' }}>
								<CodeBlock>{addedCode}</CodeBlock>
								<CopyBtn onClick={() => copy(addedCode)}>Copy</CopyBtn>
							</div>
						</div>
					)}
				</Card>
			)}
		</Page>
	);
};

export default McpServerConfig;
