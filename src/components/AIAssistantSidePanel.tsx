import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import PingOneLoginService from '../pages/protect-portal/services/pingOneLoginService';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import { logger } from '../utils/logger';

/** Admin token state passed from agent so MCP calls can use it. */
export interface AdminTokenState {
	adminToken: string | null;
	adminTokenExpiry: number | null;
	adminEnvironmentId: string | null;
}

interface AIAssistantSidePanelProps {
	isVisible: boolean;
	onClose: () => void;
	/** When true, render inline in page flow instead of fixed overlay */
	embedded?: boolean;
	/** When true, render as draggable floating panel with no dark backdrop (for full-page mode) */
	noBackdrop?: boolean;
	/** Optional: clear chat/conversation in the agent (shows Clear button when provided) */
	onClear?: () => void;
	/** Admin token (client credentials) — when set, agent uses it for MCP calls */
	adminToken?: string | null;
	adminTokenExpiry?: number | null;
	adminEnvironmentId?: string | null;
	/** Called when user gets a token via Admin form (token, expires_in seconds, environmentId) */
	onAdminTokenSet?: (token: string, expiresInSeconds: number, environmentId: string) => void;
	/** Called when user signs out from Admin */
	onAdminTokenClear?: () => void;
	/** When 'admin', switch to Admin tab (e.g. when user checks Admin in header); when 'user-login', switch to User login tab */
	requestedTab?: 'admin' | 'user-login' | undefined;
	/** When true, Admin tab auto-loads credentials from Configuration and shows a simplified one-click client_credentials login */
	adminLoginUsernamePasswordOnly?: boolean;
	/** User access token from User login tab (for introspection: "Introspect user token") */
	userAccessToken?: string | null;
	/** Called when user obtains a token via User login form (token, expires_in, optional id_token) */
	onUserTokenSet?: (token: string, expiresInSeconds: number, idToken?: string) => void;
	/** Called when user clears the user token */
	onUserTokenClear?: () => void;
	/** MCP / API call history to display in the MCP Query tab */
	apiCallHistory?: Array<{
		id: string;
		query: string;
		mcpTool: string | null;
		apiCall: { method: string; path: string } | null;
		howItWorks: string | null;
		data: unknown;
		timestamp: Date;
	}>;
}

const PANEL_WIDTH = 400;
const PANEL_INITIAL_RIGHT = 24;
const PANEL_INITIAL_TOP = 80;

const DEFAULT_ADMIN_SCOPE = 'p1:read:environment p1:read:application p1:read:resource p1:read:user';

const AIAssistantSidePanel: React.FC<AIAssistantSidePanelProps> = ({
	isVisible,
	onClose,
	embedded = false,
	noBackdrop = false,
	onClear,
	adminToken = null,
	adminTokenExpiry = null,
	adminEnvironmentId = null,
	onAdminTokenSet,
	onAdminTokenClear,
	requestedTab,
	adminLoginUsernamePasswordOnly = false,
	userAccessToken = null,
	onUserTokenSet,
	onUserTokenClear,
	apiCallHistory = [],
}) => {
	const [activeTab, setActiveTab] = useState<
		'pingone-login' | 'admin' | 'user-login' | 'documentation' | 'tools' | 'api-explorer'
	>('pingone-login');

	// When parent requests Admin or User-login tab, switch to it immediately
	useEffect(() => {
		if (isVisible && requestedTab === 'admin') {
			setActiveTab('admin');
		} else if (isVisible && requestedTab === 'user-login') {
			setActiveTab('user-login');
		}
	}, [isVisible, requestedTab]);
	const [position, setPosition] = useState({
		x: window.innerWidth - PANEL_WIDTH - PANEL_INITIAL_RIGHT,
		y: PANEL_INITIAL_TOP,
	});
	const [isDragging, setIsDragging] = useState(false);
	const dragRef = useRef({ startX: 0, startY: 0 });

	const handleHeaderMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if ((e.target as HTMLElement).closest('button')) return;
			setIsDragging(true);
			dragRef.current = {
				startX: e.clientX - position.x,
				startY: e.clientY - position.y,
			};
		},
		[position]
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;
			const x = Math.max(
				0,
				Math.min(e.clientX - dragRef.current.startX, window.innerWidth - PANEL_WIDTH)
			);
			const y = Math.max(0, e.clientY - dragRef.current.startY);
			setPosition({ x, y });
		},
		[isDragging]
	);

	const handleMouseUp = useCallback(() => setIsDragging(false), []);

	useEffect(() => {
		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, handleMouseMove, handleMouseUp]);

	if (!isVisible) return null;

	const content = (
		<SidePanelContainer $embedded={embedded}>
			<SidePanelHeader
				$draggable={!embedded}
				onMouseDown={embedded ? undefined : handleHeaderMouseDown}
			>
				<SidePanelTitle>Tools & Resources</SidePanelTitle>
				<SidePanelHeaderActions>
					{onClear && (
						<ClearChatButton
							type="button"
							onClick={onClear}
							title="Clear chat and start fresh"
							aria-label="Clear chat"
						>
							🗑 Clear
						</ClearChatButton>
					)}
					<CloseButton onClick={onClose}>×</CloseButton>
				</SidePanelHeaderActions>
			</SidePanelHeader>

			<TabsContainer>
				<TabButton
					$active={activeTab === 'pingone-login'}
					onClick={() => setActiveTab('pingone-login')}
				>
					P1 Login
				</TabButton>
				<TabButton $active={activeTab === 'admin'} onClick={() => setActiveTab('admin')}>
					Admin
				</TabButton>
				<TabButton
					$active={activeTab === 'user-login'}
					onClick={() => setActiveTab('user-login')}
					title="Get user access token for introspection (e.g. Introspect user token)"
				>
					User Login
				</TabButton>
				<TabButton
					$active={activeTab === 'documentation'}
					onClick={() => setActiveTab('documentation')}
				>
					Docs
				</TabButton>
				<TabButton $active={activeTab === 'tools'} onClick={() => setActiveTab('tools')}>
					MCP Query
				</TabButton>
				<TabButton
					$active={activeTab === 'api-explorer'}
					onClick={() => setActiveTab('api-explorer')}
				>
					API Explorer
				</TabButton>
			</TabsContainer>

			<SidePanelContent>
				{activeTab === 'pingone-login' && <PingOneLoginContent />}
				{activeTab === 'admin' && (
					<AdminLoginContent
						adminToken={adminToken}
						adminTokenExpiry={adminTokenExpiry}
						adminEnvironmentId={adminEnvironmentId}
						onAdminTokenSet={onAdminTokenSet}
						onAdminTokenClear={onAdminTokenClear}
						usernamePasswordOnly={adminLoginUsernamePasswordOnly}
					/>
				)}
				{activeTab === 'user-login' && (
					<UserLoginContent
						userAccessToken={userAccessToken}
						onUserTokenSet={onUserTokenSet}
						onUserTokenClear={onUserTokenClear}
					/>
				)}
				{activeTab === 'documentation' && <DocumentationContent />}
				{activeTab === 'tools' && <McpQueryContent history={apiCallHistory} />}
				{activeTab === 'api-explorer' && (
					<ApiExplorerContent adminToken={adminToken} adminEnvironmentId={adminEnvironmentId} />
				)}
			</SidePanelContent>
		</SidePanelContainer>
	);

	if (embedded) return content;

	// noBackdrop: render the panel directly with no overlay wrapper — avoids pointer-events
	// inheritance issues that make panel contents unclickable through a fixed inset:0 parent.
	if (noBackdrop) {
		return (
			<DraggablePanel $x={position.x} $y={position.y} $width={PANEL_WIDTH}>
				{content}
			</DraggablePanel>
		);
	}

	return (
		<SidePanelOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
			<DraggablePanel
				$x={position.x}
				$y={position.y}
				$width={PANEL_WIDTH}
				onClick={(e) => e.stopPropagation()}
			>
				{content}
			</DraggablePanel>
		</SidePanelOverlay>
	);
};

const PingOneLoginContent: React.FC = () => {
	const [environmentId, setEnvironmentId] = useState('');
	const [clientId, setClientId] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	useEffect(() => {
		const data = unifiedWorkerTokenService.getTokenDataSync();
		if (data?.credentials?.environmentId) setEnvironmentId(data.credentials.environmentId);
		// Prefer authzClientId (OIDC app with Authorization Code grant) over worker clientId
		const preferredClientId = data?.credentials?.authzClientId || data?.credentials?.clientId || '';
		if (preferredClientId) setClientId(preferredClientId);
	}, []);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setError(null);
			setSuccess(null);
			if (!environmentId.trim() || !clientId.trim()) {
				setError(
					'Environment ID and Client ID required. Configure worker token or enter manually.'
				);
				return;
			}
			if (!username.trim() || !password) {
				setError('Username and password required.');
				return;
			}
			setIsLoading(true);
			try {
				// pi.flow: redirect_uri not required per PingOne docs (https://docs.pingidentity.com/pingone/applications/p1_response_mode_values.html)
				const initRes = await PingOneLoginService.initializeEmbeddedLogin(
					environmentId.trim(),
					clientId.trim(),
					undefined, // Omit redirect_uri for pi.flow
					['openid', 'profile', 'email'],
					undefined
				);
				if (!initRes.success || !initRes.data?.flowId) {
					throw new Error(initRes.error?.message || 'Failed to start login flow');
				}
				const { flowId } = initRes.data;

				const credsRes = await PingOneLoginService.submitCredentials(
					flowId,
					username.trim(),
					password,
					clientId.trim(),
					unifiedWorkerTokenService.getTokenDataSync()?.credentials?.clientSecret
				);
				if (!credsRes.success) {
					throw new Error(credsRes.error?.message || 'Invalid credentials');
				}

				const resumeRes = await PingOneLoginService.resumeFlow(flowId);
				if (!resumeRes.success || !resumeRes.data?.authorizationCode) {
					throw new Error(resumeRes.error?.message || 'Failed to complete flow');
				} else {
					setSuccess('Login successful.');
				}
			} catch (err) {
				const msg = err instanceof Error ? err.message : 'Login failed';
				setError(msg);
				logger.error('AIAssistantSidePanel', 'PingOne login error:', undefined, err as Error);
			} finally {
				setIsLoading(false);
			}
		},
		[environmentId, clientId, username, password]
	);

	return (
		<ContentSection>
			<SectionTitle>PingOne Login (pi.flow)</SectionTitle>
			<SectionDescription>
				Sign in with PingOne using Authz code flow (response_mode=pi.flow). Uses embedded
				credentials submit when worker token is configured.
			</SectionDescription>

			<LoginCard>
				<CardTitle>Environment Login</CardTitle>
				<CardDescription>
					Use your PingOne credentials to authenticate. Client ID is pre-filled from{' '}
					<strong>Authorization Client</strong> (Configuration) when available. Requires an
					OAuth/OIDC app with <strong>Authorization Code</strong> grant — not a Worker app. pi.flow
					is a response mode; no redirect_uri is needed.
				</CardDescription>
				<form onSubmit={handleSubmit}>
					<FormRow>
						<FormLabel>Environment ID</FormLabel>
						<FormInput
							type="text"
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="e.g. env-123"
							disabled={isLoading}
						/>
					</FormRow>
					<FormRow>
						<FormLabel>Client ID</FormLabel>
						<FormInput
							type="text"
							value={clientId}
							onChange={(e) => setClientId(e.target.value)}
							placeholder="Authorization Code app Client ID (not Worker app)"
							disabled={isLoading}
						/>
					</FormRow>
					<FormRow>
						<FormLabel>Username</FormLabel>
						<FormInput
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Username or email"
							disabled={isLoading}
							autoComplete="username"
						/>
					</FormRow>
					<FormRow>
						<FormLabel>Password</FormLabel>
						<FormInput
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Password"
							disabled={isLoading}
							autoComplete="current-password"
						/>
					</FormRow>
					{error && <FormError>{error}</FormError>}
					{success && <FormSuccess>{success}</FormSuccess>}
					<LoginButton type="submit" disabled={isLoading}>
						{isLoading ? 'Signing in…' : 'Sign In'}
					</LoginButton>
				</form>
			</LoginCard>

			<LoginCard>
				<CardTitle>Configuration</CardTitle>
				<CardDescription>
					Configure worker token or OAuth app for API access and testing.
				</CardDescription>
				<LoginButton onClick={() => window.open('/configuration', '_blank')}>
					Open Configuration
				</LoginButton>
			</LoginCard>
		</ContentSection>
	);
};

/** Admin login: client credentials to get token for MCP/PingOne API calls. */
interface AdminLoginContentProps {
	adminToken: string | null;
	adminTokenExpiry: number | null;
	adminEnvironmentId: string | null;
	onAdminTokenSet?:
		| ((token: string, expiresInSeconds: number, environmentId: string) => void)
		| undefined;
	onAdminTokenClear?: (() => void) | undefined;
	/** When true, auto-load credentials from Configuration and show a simplified one-click login */
	usernamePasswordOnly?: boolean;
}

const AdminLoginContent: React.FC<AdminLoginContentProps> = ({
	adminToken,
	adminTokenExpiry,
	adminEnvironmentId,
	onAdminTokenSet,
	onAdminTokenClear,
	usernamePasswordOnly = false,
}) => {
	const [environmentId, setEnvironmentId] = useState('');
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [useFromConfig, setUseFromConfig] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const data = unifiedWorkerTokenService.getTokenDataSync();
		if (data?.credentials?.environmentId) setEnvironmentId(data.credentials.environmentId);
		if (data?.credentials?.clientId) setClientId(data.credentials.clientId);
	}, []);

	useEffect(() => {
		if (!useFromConfig) return;
		const data = unifiedWorkerTokenService.getTokenDataSync();
		if (data?.credentials) {
			setEnvironmentId(data.credentials.environmentId || '');
			setClientId(data.credentials.clientId || '');
			setClientSecret(data.credentials.clientSecret || '');
		}
	}, [useFromConfig]);

	const handleGetToken = useCallback(async () => {
		if (!onAdminTokenSet) return;
		const envId = environmentId.trim();
		const cid = clientId.trim();
		const secret = clientSecret.trim();
		if (!envId || !cid || !secret) {
			setError('Environment ID, Client ID, and Client Secret are required.');
			return;
		}
		setError(null);
		setIsLoading(true);
		try {
			const res = await fetch('/api/token-exchange', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					grant_type: 'client_credentials',
					client_id: cid,
					client_secret: secret,
					environment_id: envId,
					scope: DEFAULT_ADMIN_SCOPE,
					client_auth_method: 'client_secret_post',
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(
					data.error_description || data.error || `Token request failed (${res.status})`
				);
			}
			const token = data.access_token;
			const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600;
			if (!token) throw new Error('No access_token in response');
			onAdminTokenSet(token, expiresIn, envId);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Failed to get token';
			setError(msg);
			logger.error('AIAssistantSidePanel', 'Admin token error', undefined, err as Error);
		} finally {
			setIsLoading(false);
		}
	}, [environmentId, clientId, clientSecret, onAdminTokenSet]);

	const handleSignOut = useCallback(() => {
		onAdminTokenClear?.();
		setError(null);
	}, [onAdminTokenClear]);

	const isLoggedIn = !!adminToken && adminTokenExpiry != null && Date.now() < adminTokenExpiry;
	const expiresInMin =
		adminTokenExpiry != null
			? Math.max(0, Math.round((adminTokenExpiry - Date.now()) / 60_000))
			: 0;

	const [adminUsername, setAdminUsername] = useState('');
	const [adminPassword, setAdminPassword] = useState('');

	if (usernamePasswordOnly) {
		// PingOne does NOT support ROPC (grant_type=password).
		// Admin login uses pi.flow with response_type=token id_token.
		// response_mode=pi.flow means no browser redirect — tokens are returned directly
		// in the JSON body of the resume response. No code exchange or PKCE needed.
		const handlePiFlowAdminLogin = async () => {
			if (!onAdminTokenSet) return;
			const data = unifiedWorkerTokenService.getTokenDataSync();
			const envId = data?.credentials?.environmentId?.trim();
			const region = (data?.credentials?.region as string) || 'us';
			// Prefer authzClientId; fall back to worker clientId
			const effectiveClientId =
				data?.credentials?.authzClientId?.trim() || data?.credentials?.clientId?.trim();
			const effectiveSecret = data?.credentials?.authzClientId?.trim()
				? (data?.credentials?.authzClientSecret?.trim() ?? '')
				: (data?.credentials?.clientSecret?.trim() ?? '');
			if (!envId || !effectiveClientId) {
				setError('Configure PingOne credentials in Configuration first.');
				return;
			}
			if (!adminUsername.trim() || !adminPassword) {
				setError('Username and password are required.');
				return;
			}
			setError(null);
			setIsLoading(true);
			try {
				// Step 1: start pi.flow — response_type=token id_token with response_mode=pi.flow
				// PingOne returns tokens directly in the JSON body; no redirect, no code exchange.
				const initRes = await PingOneLoginService.initializeEmbeddedLogin(
					envId,
					effectiveClientId,
					undefined,
					['openid', 'profile', 'email'],
					region,
					'token id_token'
				);
				if (!initRes.success || !initRes.data?.flowId) {
					throw new Error(initRes.error?.message || 'Failed to start authorization flow');
				}
				const { flowId } = initRes.data;
				// Step 2: submit credentials
				const credsRes = await PingOneLoginService.submitCredentials(
					flowId,
					adminUsername.trim(),
					adminPassword,
					effectiveClientId,
					effectiveSecret || undefined
				);
				if (!credsRes.success) {
					throw new Error(credsRes.error?.message || 'Invalid credentials');
				}
				// Step 3: resume — tokens returned directly in JSON (no code exchange)
				const resumeRes = await PingOneLoginService.resumeFlow(
					flowId,
					effectiveSecret || undefined
				);
				if (!resumeRes.success || !resumeRes.data?.access_token) {
					throw new Error(resumeRes.error?.message || 'Failed to get token from resume');
				}
				const { access_token, expires_in } = resumeRes.data;
				onAdminTokenSet(access_token, expires_in ?? 3600, envId);
				setAdminPassword('');
			} catch (err) {
				const msg = err instanceof Error ? err.message : 'Login failed';
				setError(msg);
				logger.error('AIAssistantSidePanel', 'Admin login error', undefined, err as Error);
			} finally {
				setIsLoading(false);
			}
		};

		return (
			<ContentSection>
				<SectionTitle>Admin login</SectionTitle>
				<SectionDescription>
					Sign in with your PingOne admin credentials. The agent will use this token for live
					commands like &quot;list all users&quot;.
				</SectionDescription>
				{isLoggedIn ? (
					<LoginCard>
						<CardTitle>Logged in as Admin</CardTitle>
						<CardDescription>
							Environment: {adminEnvironmentId || '—'}. Token expires in {expiresInMin} min.
						</CardDescription>
						<LoginButton type="button" onClick={handleSignOut} disabled={!onAdminTokenClear}>
							Sign Out
						</LoginButton>
					</LoginCard>
				) : (
					<LoginCard>
						<CardTitle>Enter admin credentials</CardTitle>
						<CardDescription>
							Use your PingOne admin username and password. Client credentials are loaded from
							Configuration.
						</CardDescription>
						<FormRow>
							<FormLabel>Username</FormLabel>
							<FormInput
								type="text"
								value={adminUsername}
								onChange={(e) => setAdminUsername(e.target.value)}
								placeholder="admin@example.com"
								disabled={isLoading}
								autoComplete="username"
							/>
						</FormRow>
						<FormRow>
							<FormLabel>Password</FormLabel>
							<FormInput
								type="password"
								value={adminPassword}
								onChange={(e) => setAdminPassword(e.target.value)}
								placeholder="Password"
								disabled={isLoading}
								autoComplete="current-password"
							/>
						</FormRow>
						{error && <FormError>{error}</FormError>}
						<LoginButton
							type="button"
							onClick={() => {
								void handlePiFlowAdminLogin();
							}}
							disabled={isLoading || !onAdminTokenSet}
						>
							{isLoading ? 'Signing in…' : 'Sign in'}
						</LoginButton>
					</LoginCard>
				)}
			</ContentSection>
		);
	}

	return (
		<ContentSection>
			<SectionTitle>Admin (client credentials)</SectionTitle>
			<SectionDescription>
				Use an Admin app’s client credentials to get an access token. MCP calls (list users, list
				apps, etc.) will use this token until you sign out or it expires.
			</SectionDescription>

			{isLoggedIn ? (
				<LoginCard>
					<CardTitle>Logged in as Admin</CardTitle>
					<CardDescription>
						Environment: {adminEnvironmentId || '—'}. Token expires in {expiresInMin} min.
					</CardDescription>
					<LoginButton type="button" onClick={handleSignOut} disabled={!onAdminTokenClear}>
						Sign Out
					</LoginButton>
				</LoginCard>
			) : (
				<LoginCard>
					<CardTitle>Get token</CardTitle>
					<CardDescription>
						Enter Admin app credentials. Token is used for PingOne Management API calls in the
						agent.
					</CardDescription>
					<FormRow>
						<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
							<input
								type="checkbox"
								checked={useFromConfig}
								onChange={(e) => setUseFromConfig(e.target.checked)}
							/>
							Use from Configuration
						</label>
					</FormRow>
					<FormRow>
						<FormLabel>Environment ID</FormLabel>
						<FormInput
							type="text"
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="e.g. env-123"
							disabled={isLoading}
						/>
					</FormRow>
					<FormRow>
						<FormLabel>Client ID</FormLabel>
						<FormInput
							type="text"
							value={clientId}
							onChange={(e) => setClientId(e.target.value)}
							placeholder="Admin app client ID"
							disabled={isLoading}
						/>
					</FormRow>
					<FormRow>
						<FormLabel>Client Secret</FormLabel>
						<FormInput
							type="password"
							value={clientSecret}
							onChange={(e) => setClientSecret(e.target.value)}
							placeholder="Admin app client secret"
							disabled={isLoading}
							autoComplete="off"
						/>
					</FormRow>
					{error && <FormError>{error}</FormError>}
					<LoginButton
						type="button"
						onClick={handleGetToken}
						disabled={isLoading || !onAdminTokenSet}
					>
						{isLoading ? 'Getting token…' : 'Get token'}
					</LoginButton>
				</LoginCard>
			)}
		</ContentSection>
	);
};

/** User login: get a user access token via Authz Code + PKCE + pi.flow ("Introspect user token"). */

interface LoginFlowStep {
	label: string;
	method: string;
	endpoint: string;
	status: 'success' | 'error';
	detail: string;
}

interface LoginResult {
	steps: LoginFlowStep[];
	accessToken: string;
	idToken?: string;
	expiresIn: number;
	scope?: string;
	durationMs: number;
}

/** Decode the payload portion of a JWT without verifying the signature. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const json = atob(padded);
		return JSON.parse(json) as Record<string, unknown>;
	} catch {
		return null;
	}
}

interface UserLoginContentProps {
	userAccessToken: string | null;
	onUserTokenSet?: (token: string, expiresInSeconds: number, idToken?: string) => void;
	onUserTokenClear?: () => void;
}

const DEFAULT_USER_SCOPES = 'openid profile email';

const UserLoginContent: React.FC<UserLoginContentProps> = ({
	userAccessToken,
	onUserTokenSet,
	onUserTokenClear,
}) => {
	const savedCreds = unifiedWorkerTokenService.getTokenDataSync()?.credentials;

	// Use dedicated Authz client when configured; fall back to Worker client with a warning.
	// A Worker client (client_credentials) cannot be used for Authorization Code + PKCE
	// — PingOne requires a separate OIDC/Web App with Authorization Code grant.
	const [authzClientId, setAuthzClientId] = useState(savedCreds?.authzClientId ?? '');
	const [authzClientSecret, setAuthzClientSecret] = useState(savedCreds?.authzClientSecret ?? '');
	const [scopesValue, setScopesValue] = useState(
		savedCreds?.authzScopes?.join(' ') ?? DEFAULT_USER_SCOPES
	);
	const [showClientOverride, setShowClientOverride] = useState(false);

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
	const [expandedToken, setExpandedToken] = useState<'access' | 'id' | null>(null);

	// Reload saved authz config whenever panel becomes visible
	useEffect(() => {
		const creds = unifiedWorkerTokenService.getTokenDataSync()?.credentials;
		if (creds?.authzClientId) setAuthzClientId(creds.authzClientId);
		if (creds?.authzClientSecret) setAuthzClientSecret(creds.authzClientSecret);
		if (creds?.authzScopes) setScopesValue(creds.authzScopes.join(' '));
	}, []);

	const handleSignIn = useCallback(async () => {
		if (!onUserTokenSet) return;
		const data = unifiedWorkerTokenService.getTokenDataSync();
		const envId = data?.credentials?.environmentId?.trim();
		const region = (data?.credentials?.region as string) || 'us';

		// Prefer dedicated Authz client; fall back to Worker client (with a warning logged)
		const effectiveClientId = authzClientId.trim() || data?.credentials?.clientId?.trim();
		const effectiveClientSecret = authzClientId.trim()
			? authzClientSecret.trim()
			: (data?.credentials?.clientSecret?.trim() ?? '');
		const scopes = scopesValue
			.split(/[\s,]+/)
			.map((s) => s.trim())
			.filter(Boolean);

		if (!envId || !effectiveClientId) {
			setError('Configure Environment ID and an Authorization Code client in Configuration first.');
			return;
		}
		if (!authzClientId.trim()) {
			logger.warn(
				'AIAssistantSidePanel',
				'User login using Worker client — set an Authz Client ID in Configuration for a dedicated OIDC app.'
			);
		}
		const user = username.trim();
		const pwd = password;
		if (!user || !pwd) {
			setError('Username and password are required.');
			return;
		}
		setError(null);
		setLoginResult(null);
		setExpandedToken(null);
		setIsLoading(true);
		const startTime = Date.now();
		const steps: LoginFlowStep[] = [];
		try {
			// Step 1: Authorization request — response_type=token id_token + pi.flow
			// PingOne returns a flowId; tokens come back at resume (no code exchange needed)
			const initRes = await PingOneLoginService.initializeEmbeddedLogin(
				envId,
				effectiveClientId,
				undefined, // redirect_uri not needed for pi.flow
				scopes,
				region,
				'token id_token' // tokens returned directly at resume — no code exchange or PKCE needed
			);
			if (!initRes.success || !initRes.data?.flowId) {
				steps.push({ label: 'Authorize', method: 'POST', endpoint: `/environments/${envId}/as/authorize`, status: 'error', detail: initRes.error?.message ?? 'No flowId returned' });
				throw new Error(initRes.error?.message || 'Failed to start authorization flow');
			}
			const { flowId } = initRes.data;
			steps.push({ label: 'Authorize', method: 'POST', endpoint: `/environments/${envId}/as/authorize`, status: 'success', detail: `flowId: ${flowId.slice(0, 8)}…` });

			// Step 2: Submit username + password to PingOne flow endpoint
			const credsRes = await PingOneLoginService.submitCredentials(
				flowId,
				user,
				pwd,
				effectiveClientId,
				effectiveClientSecret || undefined
			);
			if (!credsRes.success) {
				steps.push({ label: 'Submit Credentials', method: 'POST', endpoint: `/environments/${envId}/flows/${flowId.slice(0, 8)}…`, status: 'error', detail: credsRes.error?.message ?? 'Credentials rejected' });
				throw new Error(credsRes.error?.message || 'Invalid credentials');
			}
			steps.push({ label: 'Submit Credentials', method: 'POST', endpoint: `/environments/${envId}/flows/${flowId.slice(0, 8)}…`, status: 'success', detail: 'Credentials accepted' });

			// Step 3: Resume pi.flow — tokens returned directly in JSON (response_type=token id_token)
			const resumeRes = await PingOneLoginService.resumeFlow(
				flowId,
				effectiveClientSecret || undefined
			);
			if (!resumeRes.success || !resumeRes.data?.access_token) {
				steps.push({ label: 'Resume (get tokens)', method: 'POST', endpoint: `/environments/${envId}/as/resume`, status: 'error', detail: resumeRes.error?.message ?? 'No tokens returned' });
				throw new Error(resumeRes.error?.message || 'Failed to get tokens from resume');
			}
			const { access_token, id_token, expires_in, scope } = resumeRes.data;
			steps.push({ label: 'Resume (get tokens)', method: 'POST', endpoint: `/environments/${envId}/as/resume`, status: 'success', detail: `scope: ${scope ?? scopes.join(' ')}` });

			logger.info('AIAssistantSidePanel', `User login succeeded — scopes: ${scope ?? scopesValue}`);
			onUserTokenSet(access_token, expires_in ?? 3600, id_token);
			setLoginResult({
				steps,
				accessToken: access_token,
				idToken: id_token,
				expiresIn: expires_in ?? 3600,
				scope: scope ?? scopes.join(' '),
				durationMs: Date.now() - startTime,
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Login failed';
			setError(msg);
			logger.error('AIAssistantSidePanel', 'User token login error', undefined, err as Error);
		} finally {
			setIsLoading(false);
		}
	}, [username, password, authzClientId, authzClientSecret, scopesValue, onUserTokenSet]);

	const handleClear = useCallback(() => {
		onUserTokenClear?.();
		setLoginResult(null);
		setExpandedToken(null);
		setError(null);
	}, [onUserTokenClear]);

	const hasToken = !!userAccessToken;
	const usingWorkerFallback = !authzClientId.trim();

	return (
		<ContentSection>
			<SectionTitle>User login</SectionTitle>
			<SectionDescription>
				Authorization Code + PKCE with <code>response_mode=pi.flow</code> (redirectless). Requires a
				PingOne OIDC/Web app with <strong>Authorization Code</strong> grant — not the Worker
				(client_credentials) app. Set the <strong>Authz Client</strong> in Configuration or below.
			</SectionDescription>

			{/* Warning when no dedicated authz client is configured */}
			{usingWorkerFallback && !hasToken && (
				<LoginCard style={{ borderColor: '#f59e0b', background: '#fffbeb' }}>
					<CardTitle style={{ color: '#92400e' }}>⚠️ No Authorization Client configured</CardTitle>
					<CardDescription>
						You have no <strong>Authz Client ID</strong> saved. The flow will attempt to use your
						Worker client, but Worker apps only support <code>client_credentials</code> — they
						typically cannot do Authorization Code + PKCE. Set a dedicated OIDC client with
						Authorization Code grant in <strong>Configuration → Authorization Client</strong>, or
						enter it below.
					</CardDescription>
				</LoginCard>
			)}

			{hasToken ? (
				<>
					{/* ── Success header ─────────────────────────────────── */}
					<LoginSuccessBanner>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<span style={{ fontWeight: 700, fontSize: 15 }}>✅ Login successful</span>
							<LoginButton
								type="button"
								onClick={handleClear}
								disabled={!onUserTokenClear}
								style={{ padding: '4px 10px', fontSize: 12 }}
							>
								Clear
							</LoginButton>
						</div>
						{loginResult && (
							<div style={{ fontSize: 12, color: '#065f46', marginTop: 4 }}>
								Completed in {loginResult.durationMs}ms · scopes: {loginResult.scope}
							</div>
						)}
					</LoginSuccessBanner>

					{/* ── Flow steps / API calls ──────────────────────────── */}
					{loginResult && (
						<FlowSection>
							<FlowSectionTitle>API calls</FlowSectionTitle>
							{loginResult.steps.map((step, i) => (
								<FlowStepRow key={i}>
									<FlowStepStatus $ok={step.status === 'success'}>
										{step.status === 'success' ? '✓' : '✗'}
									</FlowStepStatus>
									<div style={{ minWidth: 0, flex: 1 }}>
										<FlowStepLabel>{step.label}</FlowStepLabel>
										<FlowStepEndpoint>
											<code style={{ fontSize: 10 }}>{step.method}</code> {step.endpoint}
										</FlowStepEndpoint>
										<FlowStepDetail>{step.detail}</FlowStepDetail>
									</div>
								</FlowStepRow>
							))}
						</FlowSection>
					)}

					{/* ── Tokens ─────────────────────────────────────────── */}
					{loginResult && (
						<FlowSection>
							<FlowSectionTitle>Tokens</FlowSectionTitle>

							{/* Access Token */}
							<TokenRow>
								<TokenRowHeader
									onClick={() => setExpandedToken((v) => (v === 'access' ? null : 'access'))}
								>
									<TokenLabel>Access Token</TokenLabel>
									<TokenPreview>{loginResult.accessToken.slice(0, 24)}…</TokenPreview>
									<ExpandChevron $expanded={expandedToken === 'access'}>▼</ExpandChevron>
								</TokenRowHeader>
								{expandedToken === 'access' && (
									<TokenPayload>
										{Object.entries(decodeJwtPayload(loginResult.accessToken) ?? {}).map(
											([k, v]) => (
												<TokenClaim key={k}>
													<TokenClaimKey>{k}</TokenClaimKey>
													<TokenClaimVal>
														{typeof v === 'object' ? JSON.stringify(v) : String(v)}
													</TokenClaimVal>
												</TokenClaim>
											)
										)}
									</TokenPayload>
								)}
							</TokenRow>

							{/* ID Token */}
							{loginResult.idToken && (
								<TokenRow>
									<TokenRowHeader
										onClick={() => setExpandedToken((v) => (v === 'id' ? null : 'id'))}
									>
										<TokenLabel>ID Token</TokenLabel>
										<TokenPreview>{loginResult.idToken.slice(0, 24)}…</TokenPreview>
										<ExpandChevron $expanded={expandedToken === 'id'}>▼</ExpandChevron>
									</TokenRowHeader>
									{expandedToken === 'id' && (
										<TokenPayload>
											{Object.entries(decodeJwtPayload(loginResult.idToken) ?? {}).map(
												([k, v]) => (
													<TokenClaim key={k}>
														<TokenClaimKey>{k}</TokenClaimKey>
														<TokenClaimVal>
															{typeof v === 'object' ? JSON.stringify(v) : String(v)}
														</TokenClaimVal>
													</TokenClaim>
												)
											)}
										</TokenPayload>
									)}
								</TokenRow>
							)}
						</FlowSection>
					)}

					{/* Fallback when arriving from localStorage (no loginResult) */}
					{!loginResult && (
						<LoginCard>
							<CardDescription>
								Token loaded from session. Say{' '}
								<strong>&quot;Introspect user token&quot;</strong> or{' '}
								<strong>&quot;Show my token&quot;</strong>.
							</CardDescription>
						</LoginCard>
					)}
				</>
			) : (
				<LoginCard>
					{/* Client override section */}
					<FormRow style={{ marginBottom: 0 }}>
						<button
							type="button"
							onClick={() => setShowClientOverride((v) => !v)}
							style={{
								background: 'none',
								border: 'none',
								color: '#667eea',
								fontSize: '12px',
								cursor: 'pointer',
								padding: '0',
								textDecoration: 'underline',
							}}
						>
							{showClientOverride ? '▲ Hide' : '▼ Authz Client'}{' '}
							{authzClientId ? `(${authzClientId.slice(0, 8)}…)` : '(not set)'}
						</button>
					</FormRow>

					{showClientOverride && (
						<>
							<FormRow>
								<FormLabel>Authz Client ID</FormLabel>
								<FormInput
									type="text"
									value={authzClientId}
									onChange={(e) => setAuthzClientId(e.target.value)}
									placeholder="OIDC app Client ID (Authorization Code grant)"
									disabled={isLoading}
								/>
							</FormRow>
							<FormRow>
								<FormLabel>Authz Client Secret</FormLabel>
								<FormInput
									type="password"
									value={authzClientSecret}
									onChange={(e) => setAuthzClientSecret(e.target.value)}
									placeholder="Leave empty for public PKCE-only clients"
									disabled={isLoading}
								/>
							</FormRow>
							<FormRow>
								<FormLabel>Scopes</FormLabel>
								<FormInput
									type="text"
									value={scopesValue}
									onChange={(e) => setScopesValue(e.target.value)}
									placeholder="openid profile email"
									disabled={isLoading}
									title="Space-separated OAuth scopes. Future banking demo: add transfer:funds account:read"
								/>
							</FormRow>
						</>
					)}

					<FormRow>
						<FormLabel>Username</FormLabel>
						<FormInput
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="PingOne username or email"
							disabled={isLoading}
							autoComplete="username"
						/>
					</FormRow>
					<FormRow>
						<FormLabel>Password</FormLabel>
						<FormInput
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Password"
							disabled={isLoading}
							autoComplete="current-password"
						/>
					</FormRow>
					{error && <FormError>{error}</FormError>}
					<LoginButton type="button" onClick={handleSignIn} disabled={isLoading || !onUserTokenSet}>
						{isLoading ? 'Signing in…' : 'Sign in'}
					</LoginButton>
				</LoginCard>
			)}
		</ContentSection>
	);
};

const DocumentationContent: React.FC = () => (
	<ContentSection>
		<SectionTitle>Documentation & Resources</SectionTitle>

		<ResourceLink
			href="https://docs.pingidentity.com/pingone/p1_cloud__platform_main_landing_page.html"
			target="_blank"
		>
			<ResourceTitle>PingOne Platform Docs</ResourceTitle>
			<ResourceDescription>
				Complete PingOne platform documentation and API references
			</ResourceDescription>
		</ResourceLink>

		<ResourceLink href="https://apidocs.pingidentity.com/pingone/platform/v1/api/" target="_blank">
			<ResourceTitle>API Documentation</ResourceTitle>
			<ResourceDescription>
				Interactive API documentation for all PingOne services
			</ResourceDescription>
		</ResourceLink>

		<ResourceLink href="/user-guide" target="_blank">
			<ResourceTitle>User Guide</ResourceTitle>
			<ResourceDescription>Learn how to use the OAuth Playground effectively</ResourceDescription>
		</ResourceLink>
	</ContentSection>
);

// ── MCP Query history tab ────────────────────────────────────────────────────

interface McpQueryRecord {
	id: string;
	query: string;
	mcpTool: string | null;
	apiCall: { method: string; path: string } | null;
	howItWorks: string | null;
	data: unknown;
	timestamp: Date;
}

const McpQueryContent: React.FC<{ history: McpQueryRecord[] }> = ({ history }) => {
	if (history.length === 0) {
		return (
			<ContentSection>
				<SectionTitle>MCP Query Log</SectionTitle>
				<EmptyState>
					<EmptyIcon>🔌</EmptyIcon>
					<EmptyText>No MCP queries yet.</EmptyText>
					<EmptyHint>
						Ask the assistant something like "List all users" or "Get worker token" to see live API
						calls here.
					</EmptyHint>
				</EmptyState>
			</ContentSection>
		);
	}

	const recent = [...history].reverse().slice(0, 20);

	return (
		<ContentSection>
			<SectionTitle>MCP Query Log</SectionTitle>
			<McpList>
				{recent.map((rec) => (
					<McpEntry key={rec.id}>
						<McpEntryTime>
							{rec.timestamp instanceof Date
								? rec.timestamp.toLocaleTimeString()
								: new Date(rec.timestamp).toLocaleTimeString()}
						</McpEntryTime>
						<McpEntryQuery>{rec.query}</McpEntryQuery>
						{rec.mcpTool && <McpToolBadge>{rec.mcpTool}</McpToolBadge>}
						{rec.apiCall && (
							<McpApiCall>
								<McpApiMethod $method={rec.apiCall.method}>{rec.apiCall.method}</McpApiMethod>
								<McpApiPath>{rec.apiCall.path}</McpApiPath>
							</McpApiCall>
						)}
						{rec.howItWorks && <McpHowItWorks>{rec.howItWorks}</McpHowItWorks>}
					</McpEntry>
				))}
			</McpList>
		</ContentSection>
	);
};

// ── API Explorer tab ─────────────────────────────────────────────────────────

interface ApiEndpointDef {
	label: string;
	method: 'GET' | 'POST' | 'DELETE';
	path: string; // uses {envId} placeholder
	description: string;
}

const API_ENDPOINTS: ApiEndpointDef[] = [
	{
		label: 'Get Environment',
		method: 'GET',
		path: '/v1/environments/{envId}',
		description: 'Retrieve environment details and configuration',
	},
	{
		label: 'List Users',
		method: 'GET',
		path: '/v1/environments/{envId}/users',
		description: 'List all users in the environment',
	},
	{
		label: 'List Applications',
		method: 'GET',
		path: '/v1/environments/{envId}/applications',
		description: 'List all OAuth / OIDC applications',
	},
	{
		label: 'List Populations',
		method: 'GET',
		path: '/v1/environments/{envId}/populations',
		description: 'List all user populations',
	},
	{
		label: 'List Resources',
		method: 'GET',
		path: '/v1/environments/{envId}/resources',
		description: 'List OAuth resource server definitions',
	},
	{
		label: 'List Schemas',
		method: 'GET',
		path: '/v1/environments/{envId}/schemas',
		description: 'List user schema attribute definitions',
	},
	{
		label: 'List Custom Domains',
		method: 'GET',
		path: '/v1/environments/{envId}/customDomains',
		description: 'List custom domains configured for the environment',
	},
	{
		label: 'List Password Policies',
		method: 'GET',
		path: '/v1/environments/{envId}/passwordPolicies',
		description: 'List password policy configurations',
	},
	{
		label: 'List Roles',
		method: 'GET',
		path: '/v1/roles',
		description: 'List all PingOne admin roles',
	},
];

interface ApiExplorerContentProps {
	adminToken: string | null;
	adminEnvironmentId: string | null;
}

const ApiExplorerContent: React.FC<ApiExplorerContentProps> = ({
	adminToken,
	adminEnvironmentId,
}) => {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [response, setResponse] = useState<unknown>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [statusCode, setStatusCode] = useState<number | null>(null);

	const selected = API_ENDPOINTS[selectedIndex];
	const envId = adminEnvironmentId ?? '{envId}';
	const resolvedPath = selected.path.replace('{envId}', envId);
	const resolvedUrl = `https://api.pingone.com${resolvedPath}`;

	const canRun = !!adminToken && !!adminEnvironmentId;

	const handleRun = useCallback(async () => {
		if (!adminToken || !adminEnvironmentId) return;
		setIsLoading(true);
		setError(null);
		setResponse(null);
		setStatusCode(null);
		try {
			const url = `https://api.pingone.com${selected.path.replace('{envId}', adminEnvironmentId)}`;
			const res = await fetch(url, {
				method: selected.method,
				headers: { Authorization: `Bearer ${adminToken}` },
			});
			setStatusCode(res.status);
			const body = await res.json().catch(() => null);
			if (!res.ok) {
				const msg =
					(body as Record<string, string> | null)?.message ||
					(body as Record<string, string> | null)?.detail ||
					`HTTP ${res.status}`;
				setError(msg);
			} else {
				setResponse(body);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Network error');
		} finally {
			setIsLoading(false);
		}
	}, [adminToken, adminEnvironmentId, selected]);

	return (
		<ContentSection>
			<SectionTitle>API Explorer</SectionTitle>
			<SectionDescription>
				Run live PingOne Management API calls using your admin (worker) token. Select an endpoint,
				inspect the resolved URL, then hit <strong>Run</strong>.
			</SectionDescription>

			{!canRun && (
				<ApiExplorerAlert>
					⚠️ Get an admin token first — go to the <strong>Admin</strong> tab.
				</ApiExplorerAlert>
			)}

			{/* Endpoint selector */}
			<ApiEndpointList>
				{API_ENDPOINTS.map((ep, i) => (
					<ApiEndpointItem
						key={ep.label}
						$active={i === selectedIndex}
						onClick={() => {
							setSelectedIndex(i);
							setResponse(null);
							setError(null);
							setStatusCode(null);
						}}
					>
						<ApiEndpointMethod $method={ep.method}>{ep.method}</ApiEndpointMethod>
						<ApiEndpointLabel>{ep.label}</ApiEndpointLabel>
					</ApiEndpointItem>
				))}
			</ApiEndpointList>

			{/* Resolved URL + description */}
			<ApiRequestBox>
				<ApiRequestDescription>{selected.description}</ApiRequestDescription>
				<ApiRequestUrl>{resolvedUrl}</ApiRequestUrl>
				<ApiRunButton
					type="button"
					onClick={() => {
						void handleRun();
					}}
					disabled={!canRun || isLoading}
				>
					{isLoading ? 'Running…' : '▶ Run'}
				</ApiRunButton>
			</ApiRequestBox>

			{/* Response area */}
			{(response !== null || error !== null) && (
				<ApiResponseBox $ok={error === null}>
					<ApiResponseStatus $ok={error === null}>
						{statusCode !== null ? `HTTP ${statusCode}` : ''} {error === null ? '✓ OK' : '✗ Error'}
					</ApiResponseStatus>
					{error !== null ? (
						<ApiResponseError>{error}</ApiResponseError>
					) : (
						<ApiResponseBody>
							<JsonViewer data={response} />
						</ApiResponseBody>
					)}
				</ApiResponseBox>
			)}
		</ContentSection>
	);
};

// ── JSON Viewer with per-value copy buttons ───────────────────────────────────

const CopyValue: React.FC<{ value: string }> = ({ value }) => {
	const [copied, setCopied] = React.useState(false);
	const handleCopy = React.useCallback(() => {
		void navigator.clipboard.writeText(value).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		});
	}, [value]);
	return (
		<JsonCopyBtn type="button" onClick={handleCopy} $copied={copied} title={`Copy: ${value}`}>
			{copied ? '✓' : '⎘'}
		</JsonCopyBtn>
	);
};

const JsonViewer: React.FC<{ data: unknown; depth?: number }> = ({ data, depth = 0 }) => {
	if (data === null || data === undefined) {
		return <JsonNull>null</JsonNull>;
	}
	if (typeof data === 'boolean') {
		return <JsonBoolVal>{String(data)}</JsonBoolVal>;
	}
	if (typeof data === 'number') {
		return (
			<JsonLeafRow>
				<JsonNumberVal>{data}</JsonNumberVal>
				<CopyValue value={String(data)} />
			</JsonLeafRow>
		);
	}
	if (typeof data === 'string') {
		return (
			<JsonLeafRow>
				<JsonStringVal>&quot;{data}&quot;</JsonStringVal>
				<CopyValue value={data} />
			</JsonLeafRow>
		);
	}
	if (Array.isArray(data)) {
		if (data.length === 0) return <JsonNull>[]</JsonNull>;
		return (
			<JsonBlock $depth={depth}>
				{data.map((item, i) => (
					// eslint-disable-next-line react/no-array-index-key
					<JsonRow key={i}>
						<JsonKey>[{i}]</JsonKey>
						<JsonViewer data={item} depth={depth + 1} />
					</JsonRow>
				))}
			</JsonBlock>
		);
	}
	if (typeof data === 'object') {
		const entries = Object.entries(data as Record<string, unknown>);
		if (entries.length === 0) return <JsonNull>{'{}'}</JsonNull>;
		return (
			<JsonBlock $depth={depth}>
				{entries.map(([k, v]) => (
					<JsonRow key={k}>
						<JsonKey>{k}:</JsonKey>
						<JsonViewer data={v} depth={depth + 1} />
					</JsonRow>
				))}
			</JsonBlock>
		);
	}
	return <JsonStringVal>{String(data)}</JsonStringVal>;
};

// Styled Components
const SidePanelOverlay = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.4);
	z-index: 10052;
`;

const DraggablePanel = styled.div<{ $x: number; $y: number; $width: number }>`
	position: fixed;
	left: ${({ $x }) => $x}px;
	top: ${({ $y }) => $y}px;
	width: ${({ $width }) => $width}px;
	height: min(600px, calc(100vh - ${({ $y }) => $y}px - 16px));
	max-height: 85vh;
	z-index: 10053;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
	border-radius: 12px;
	overflow: hidden;
	display: flex;
	flex-direction: column;
`;

const SidePanelContainer = styled.div<{ $embedded?: boolean }>`
	width: 100%;
	flex: 1;
	min-height: 0;
	background: white;
	display: flex;
	flex-direction: column;
	box-shadow: ${({ $embedded }) => ($embedded ? 'none' : '-4px 0 20px rgba(0, 0, 0, 0.15)')};
`;

const SidePanelHeader = styled.div<{ $draggable?: boolean }>`
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
	padding: 16px 20px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	user-select: ${({ $draggable }) => ($draggable ? 'none' : 'auto')};
	cursor: ${({ $draggable }) => ($draggable ? 'grab' : 'auto')};

	&:active {
		cursor: ${({ $draggable }) => ($draggable ? 'grabbing' : 'auto')};
	}
`;

const SidePanelTitle = styled.div`
	font-size: 16px;
	font-weight: 600;
`;

const SidePanelHeaderActions = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const ClearChatButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	font-size: 13px;
	padding: 6px 10px;
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 4px;
	transition: background 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.3);
	}
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	color: white;
	font-size: 24px;
	cursor: pointer;
	padding: 0;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	transition: background 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
	}
`;

const TabsContainer = styled.div`
	display: flex;
	background: #f8f9fa;
	border-bottom: 1px solid #e0e0e0;
	overflow: visible;
`;

const TabButton = styled.button<{ $active?: boolean }>`
	flex: 1;
	min-width: 0;
	background: ${({ $active }) => ($active ? 'white' : 'transparent')};
	border: none;
	border-right: 1px solid #e0e0e0;
	color: ${({ $active }) => ($active ? '#2563eb' : '#555')};
	padding: 8px 6px;
	font-size: 11px;
	font-weight: ${({ $active }) => ($active ? '600' : '400')};
	cursor: pointer;
	transition: all 0.2s;
	border-bottom: ${({ $active }) => ($active ? '2px solid #2563eb' : '2px solid transparent')};
	white-space: nowrap;
	overflow: visible;

	&:last-child {
		border-right: none;
	}

	&:hover {
		background: rgba(37, 99, 235, 0.05);
		color: #2563eb;
	}
`;

const SidePanelContent = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 20px;
`;

const ContentSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
`;

const SectionTitle = styled.h2`
	font-size: 18px;
	font-weight: 600;
	color: #333;
	margin: 0;
`;

const SectionDescription = styled.p`
	font-size: 14px;
	color: #666;
	line-height: 1.5;
	margin: 0;
`;

const FormRow = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	margin-bottom: 12px;
`;

const FormLabel = styled.label`
	font-size: 13px;
	font-weight: 500;
	color: #333;
`;

const FormInput = styled.input`
	padding: 8px 12px;
	border: 1px solid #e0e0e0;
	border-radius: 6px;
	font-size: 14px;

	&:focus {
		outline: none;
		border-color: #2563eb;
	}
	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
`;

const FormError = styled.div`
	font-size: 13px;
	color: #dc2626;
	margin-bottom: 12px;
`;

const FormSuccess = styled.div`
	font-size: 13px;
	color: #059669;
	margin-bottom: 12px;
`;

const LoginCard = styled.div`
	background: #f8f9fa;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	padding: 16px;
`;

const CardTitle = styled.h3`
	font-size: 16px;
	font-weight: 600;
	color: #333;
	margin: 0 0 8px 0;
`;

const CardDescription = styled.p`
	font-size: 14px;
	color: #666;
	line-height: 1.4;
	margin: 0 0 16px 0;

	code {
		font-family: monospace;
		background: #f0f0f0;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 12px;
	}
`;

const LoginButton = styled.button`
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	border: none;
	padding: 10px 16px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
`;

// ── User Login success page components ──────────────────────────────────────

const LoginSuccessBanner = styled.div`
	background: #ecfdf5;
	border: 1px solid #6ee7b7;
	border-radius: 8px;
	padding: 12px 14px;
	margin-bottom: 10px;
`;

const FlowSection = styled.div`
	margin-bottom: 10px;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	overflow: hidden;
`;

const FlowSectionTitle = styled.div`
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: #6b7280;
	padding: 8px 12px 6px;
	background: #f8f9fa;
	border-bottom: 1px solid #e0e0e0;
`;

const FlowStepRow = styled.div`
	display: flex;
	gap: 10px;
	padding: 8px 12px;
	border-bottom: 1px solid #f0f0f0;
	&:last-child { border-bottom: none; }
`;

const FlowStepStatus = styled.div<{ $ok: boolean }>`
	font-size: 13px;
	font-weight: 700;
	color: ${({ $ok }) => ($ok ? '#059669' : '#dc2626')};
	flex-shrink: 0;
	padding-top: 1px;
`;

const FlowStepLabel = styled.div`
	font-size: 12px;
	font-weight: 600;
	color: #333;
`;

const FlowStepEndpoint = styled.div`
	font-size: 10px;
	color: #6b7280;
	margin-top: 1px;
	word-break: break-all;
`;

const FlowStepDetail = styled.div`
	font-size: 11px;
	color: #059669;
	margin-top: 2px;
`;

const TokenRow = styled.div`
	border-bottom: 1px solid #f0f0f0;
	&:last-child { border-bottom: none; }
`;

const TokenRowHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	cursor: pointer;
	user-select: none;
	&:hover { background: #f8f9fa; }
`;

const TokenLabel = styled.span`
	font-size: 12px;
	font-weight: 600;
	color: #333;
	flex-shrink: 0;
`;

const TokenPreview = styled.span`
	font-size: 11px;
	font-family: monospace;
	color: #6b7280;
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const ExpandChevron = styled.span<{ $expanded: boolean }>`
	font-size: 10px;
	color: #9ca3af;
	flex-shrink: 0;
	transform: ${({ $expanded }) => ($expanded ? 'rotate(180deg)' : 'rotate(0deg)')};
	transition: transform 0.15s;
`;

const TokenPayload = styled.div`
	padding: 0 12px 10px 12px;
	background: #fafafa;
	display: flex;
	flex-direction: column;
	gap: 3px;
`;

const TokenClaim = styled.div`
	display: flex;
	gap: 8px;
	font-size: 11px;
`;

const TokenClaimKey = styled.span`
	color: #6b7280;
	flex-shrink: 0;
	min-width: 80px;
	font-family: monospace;
`;

const TokenClaimVal = styled.span`
	color: #111827;
	font-family: monospace;
	word-break: break-all;
`;

// ── end User Login success components ───────────────────────────────────────

const ResourceLink = styled.a`
	display: block;
	background: white;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	padding: 16px;
	text-decoration: none;
	color: inherit;
	transition: all 0.2s;

	&:hover {
		border-color: #3b82f6;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
		transform: translateY(-1px);
	}
`;

const ResourceTitle = styled.h3`
	font-size: 16px;
	font-weight: 600;
	color: #2563eb;
	margin: 0 0 8px 0;
`;

const ResourceDescription = styled.p`
	font-size: 14px;
	color: #666;
	line-height: 1.4;
	margin: 0;
`;

// ── MCP Query Log styled components ─────────────────────────────────────────

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40px 20px;
	gap: 10px;
	text-align: center;
`;

const EmptyIcon = styled.div`
	font-size: 32px;
`;

const EmptyText = styled.p`
	font-size: 15px;
	font-weight: 600;
	color: #444;
	margin: 0;
`;

const EmptyHint = styled.p`
	font-size: 12px;
	color: #888;
	margin: 0;
	line-height: 1.5;
`;

const McpList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const McpEntry = styled.div`
	background: #f8f9fa;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 12px 14px;
	display: flex;
	flex-direction: column;
	gap: 5px;
`;

const McpEntryTime = styled.span`
	font-size: 10px;
	color: #9ca3af;
	font-variant-numeric: tabular-nums;
`;

const McpEntryQuery = styled.p`
	font-size: 13px;
	font-weight: 500;
	color: #1f2937;
	margin: 0;
	word-break: break-word;
`;

const McpToolBadge = styled.span`
	display: inline-block;
	background: #ede9fe;
	color: #6d28d9;
	font-size: 11px;
	font-weight: 600;
	padding: 2px 8px;
	border-radius: 12px;
	align-self: flex-start;
	font-family: 'SF Mono', 'Fira Code', monospace;
`;

const McpApiCall = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	flex-wrap: wrap;
`;

const METHOD_COLORS: Record<string, string> = {
	GET: '#16a34a',
	POST: '#2563eb',
	PUT: '#d97706',
	PATCH: '#d97706',
	DELETE: '#dc2626',
};

const McpApiMethod = styled.span<{ $method: string }>`
	font-size: 10px;
	font-weight: 700;
	padding: 1px 5px;
	border-radius: 3px;
	font-family: monospace;
	background: ${({ $method }) => METHOD_COLORS[$method] ?? '#6b7280'}22;
	color: ${({ $method }) => METHOD_COLORS[$method] ?? '#6b7280'};
	border: 1px solid ${({ $method }) => METHOD_COLORS[$method] ?? '#6b7280'}44;
`;

const McpApiPath = styled.code`
	font-size: 11px;
	color: #374151;
	word-break: break-all;
	font-family: 'SF Mono', 'Fira Code', monospace;
`;

const McpHowItWorks = styled.p`
	font-size: 11px;
	color: #6b7280;
	margin: 2px 0 0;
	line-height: 1.4;
	border-top: 1px solid #e5e7eb;
	padding-top: 6px;
`;

// ── API Explorer styled components ───────────────────────────────────────────

const ApiExplorerAlert = styled.div`
	background: #fffbeb;
	border: 1px solid #f59e0b;
	border-radius: 6px;
	padding: 10px 12px;
	font-size: 12px;
	color: #92400e;
	margin-bottom: 12px;
`;

const ApiEndpointList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	overflow: hidden;
	margin-bottom: 12px;
`;

const ApiEndpointItem = styled.button<{ $active: boolean }>`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	background: ${({ $active }) => ($active ? '#eff6ff' : 'white')};
	border: none;
	border-bottom: 1px solid #f3f4f6;
	cursor: pointer;
	text-align: left;
	transition: background 0.1s;

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background: ${({ $active }) => ($active ? '#eff6ff' : '#f9fafb')};
	}
`;

const ApiEndpointMethod = styled.span<{ $method: string }>`
	font-size: 9px;
	font-weight: 700;
	font-family: monospace;
	padding: 2px 5px;
	border-radius: 3px;
	min-width: 36px;
	text-align: center;
	background: ${({ $method }) => METHOD_COLORS[$method] ?? '#6b7280'}22;
	color: ${({ $method }) => METHOD_COLORS[$method] ?? '#6b7280'};
	border: 1px solid ${({ $method }) => METHOD_COLORS[$method] ?? '#6b7280'}44;
`;

const ApiEndpointLabel = styled.span`
	font-size: 12px;
	color: #374151;
	font-weight: 500;
`;

const ApiRequestBox = styled.div`
	background: #f8f9fa;
	border: 1px solid #e5e7eb;
	border-radius: 8px;
	padding: 12px;
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 12px;
`;

const ApiRequestDescription = styled.p`
	font-size: 12px;
	color: #6b7280;
	margin: 0;
`;

const ApiRequestUrl = styled.code`
	font-size: 11px;
	font-family: 'SF Mono', 'Fira Code', monospace;
	color: #1f2937;
	word-break: break-all;
	background: #fff;
	border: 1px solid #e5e7eb;
	border-radius: 4px;
	padding: 6px 8px;
	display: block;
`;

const ApiRunButton = styled.button`
	align-self: flex-start;
	background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
	color: white;
	border: none;
	padding: 7px 16px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.15s;

	&:hover:not(:disabled) {
		box-shadow: 0 3px 10px rgba(37, 99, 235, 0.35);
		transform: translateY(-1px);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ApiResponseBox = styled.div<{ $ok: boolean }>`
	border: 1px solid ${({ $ok }) => ($ok ? '#d1fae5' : '#fecaca')};
	border-radius: 8px;
	overflow: hidden;
`;

const ApiResponseStatus = styled.div<{ $ok: boolean }>`
	padding: 6px 12px;
	font-size: 11px;
	font-weight: 700;
	background: ${({ $ok }) => ($ok ? '#d1fae5' : '#fecaca')};
	color: ${({ $ok }) => ($ok ? '#065f46' : '#991b1b')};
`;

const ApiResponseError = styled.p`
	padding: 10px 12px;
	margin: 0;
	font-size: 12px;
	color: #991b1b;
`;

const ApiResponseBody = styled.div`
	padding: 10px 12px;
	max-height: 340px;
	overflow-y: auto;
	background: #fff;
`;

// ── JSON Viewer styled components ────────────────────────────────────────────

const JsonBlock = styled.div<{ $depth: number }>`
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding-left: ${({ $depth }) => ($depth > 0 ? '12px' : '0')};
	border-left: ${({ $depth }) => ($depth > 0 ? '2px solid #e5e7eb' : 'none')};
`;

const JsonRow = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 6px;
	flex-wrap: wrap;
	padding: 1px 0;
`;

const JsonKey = styled.span`
	font-size: 11px;
	font-weight: 600;
	color: #6b7280;
	font-family: 'SF Mono', 'Fira Code', monospace;
	white-space: nowrap;
`;

const JsonLeafRow = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
	flex-wrap: wrap;
`;

const JsonStringVal = styled.span`
	font-size: 11px;
	color: #1d4ed8;
	font-family: 'SF Mono', 'Fira Code', monospace;
	word-break: break-all;
`;

const JsonNumberVal = styled.span`
	font-size: 11px;
	color: #059669;
	font-family: 'SF Mono', 'Fira Code', monospace;
`;

const JsonBoolVal = styled.span`
	font-size: 11px;
	color: #d97706;
	font-family: 'SF Mono', 'Fira Code', monospace;
`;

const JsonNull = styled.span`
	font-size: 11px;
	color: #9ca3af;
	font-family: 'SF Mono', 'Fira Code', monospace;
`;

const JsonCopyBtn = styled.button<{ $copied: boolean }>`
	background: ${({ $copied }) => ($copied ? '#d1fae5' : '#f3f4f6')};
	border: 1px solid ${({ $copied }) => ($copied ? '#6ee7b7' : '#e5e7eb')};
	border-radius: 3px;
	padding: 1px 5px;
	font-size: 10px;
	cursor: pointer;
	color: ${({ $copied }) => ($copied ? '#065f46' : '#6b7280')};
	line-height: 1.4;
	transition: all 0.15s;
	flex-shrink: 0;

	&:hover {
		background: #e0e7ff;
		border-color: #a5b4fc;
		color: #3730a3;
	}
`;

export default AIAssistantSidePanel;
