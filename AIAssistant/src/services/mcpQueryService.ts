/**
 * mcpQueryService — frontend client for the /api/mcp/query backend endpoint.
 *
 * When the "Live" toggle is on in the AI Assistant, this service sends the
 * user's query to the backend which:
 *   1. Classifies it into a PingOne MCP tool intent
 *   2. Calls the real PingOne API using stored/provided credentials
 *   3. Returns the live data + educational metadata (tool name, API call, explanation)
 *
 * The result is displayed as a structured "MCP Result" card in the chat UI.
 */

export interface McpQueryOptions {
	/** Pre-obtained worker token (optional — backend falls back to env vars) */
	workerToken?: string;
	/** PingOne environment ID (optional — backend falls back to env vars) */
	environmentId?: string;
	/** Region hint: com (NA), eu, ca, ap, au, sg */
	region?: string;
	/** User OAuth access token for OIDC UserInfo (GET .../as/userinfo). Required for "Get userinfo"; worker token cannot be used. */
	userAccessToken?: string;
	/** Token to introspect — when provided, backend uses this token for pingone_introspect_token instead of worker/admin token. */
	tokenToIntrospect?: string;
}

export interface McpQueryResult {
	success: boolean;
	/** Human-readable summary of the result (e.g. "Found 5 applications.") */
	answer: string;
	/** MCP tool name used (e.g. "pingone_list_users") */
	mcpTool: string | null;
	/** HTTP method + path of the underlying PingOne API call */
	apiCall: { method: string; path: string } | null;
	/** One-paragraph explanation of how the tool + API work together */
	howItWorks: string | null;
	/** Raw data returned by PingOne (array or object) */
	data: unknown;
	/** True if credentials were not available — educational info still returned */
	credentialsRequired?: boolean;
	/** Error message if the call failed */
	error?: string;
	/** UI toggle — true makes the chat card show raw JSON instead of formatted data */
	rawJson?: boolean;
}

/**
 * Classify a query locally (mirrors backend logic) to show the tool name
 * immediately before the network call returns.
 */
const LOCAL_PATTERNS: Array<{ pattern: RegExp; tool: string }> = [
	// worker token (must be first — broad pattern)
	// Admin login — open username/password form (high priority; before worker token)
	{
		pattern: /\badmin\s+login\b|\blogin\s+as\s+admin\b|\blogin\s+admin\b/i,
		tool: 'admin_login',
	},
	{ pattern: /worker.?token|client.?credentials|access.?token|get.?token|issue.?token/i, tool: 'pingone_get_worker_token' },
	// list tools — high priority; matches "List MCP tools", "list tools", "mcp tools"
	{
		pattern: /\blist\s+mcp\s+tools\b|\b(?:list|show|what|which)\s+(?:all\s+)?(?:mcp\s+)?tools?\b|\bavailable\s+(?:mcp\s+)?tools?\b|\bmcp\s+tools\b|\blist\s+tools\b/i,
		tool: 'mcp_list_tools',
	},
	// help (high priority)
	{
		pattern: /^help$|what can (you|i|we) do|what can.*look.?up|what.*commands|how do i (use|start|get start)|how can.*help|what.*can.*do.*chat|what.*user.*chat|chat.*user|what.*ping.*do|what.*look.*up.*ping/i,
		tool: 'ai_assistant_help',
	},
	// applications
	{ pattern: /list.*app|show.*app|get.*apps|all.*app|what.*app|fetch.*app/i, tool: 'pingone.applications.list' },
	{ pattern: /app.*secret|client\s+secret|show.*secret|secret.*app/i, tool: 'pingone_get_application_secret' },
	{ pattern: /rotate.*secret|regenerate.*secret|refresh.*client.*secret/i, tool: 'pingone_rotate_application_secret' },
	{ pattern: /creat.*app(?:lication)?|add.*app(?:lication)?|new.*app(?:lication)?|register.*app/i, tool: 'pingone_create_application' },
	{ pattern: /delet.*app(?:lication)?|remov.*app(?:lication)?/i, tool: 'pingone_delete_application' },
	{ pattern: /get\s+app|find\s+app|app\s+details|app\s+info|which\s+app/i, tool: 'pingone_get_application' },
	// org licenses (before users so "Show org licenses" doesn't match show.*user)
	{ pattern: /\bshow\s+org\s+licenses\b|\borg\s+licenses\b|licens|org.*licens|capacity/i, tool: 'pingone_get_organization_licenses' },
	// users — create/delete before get so "Delete user <uuid>" matches delete
	{ pattern: /list.*user|show.*users|all.*user|get.*users|fetch.*user/i, tool: 'pingone_list_users' },
	{ pattern: /creat.*user|new.*user|register.*user|onboard.*user/i, tool: 'pingone_create_user' },
	{ pattern: /delet.*user|remov.*user|deactivat.*user/i, tool: 'pingone_delete_user' },
	// OIDC UserInfo (before get_user so "Get userinfo" hits this, not Management API user lookup)
	{
		pattern: /userinfo|get\s+userinfo|\buser\s+info\b|user\s+profile\s+claim|current.*user.*claim/i,
		tool: 'pingone_userinfo',
	},
	{
		pattern: /get\s+user(?!info)|find\s+user|look\s*up\s+user|show\s+user(?!info)|who\s+is\s+user|get\s+userinfo\s+use\s+\w+|userinfo\s+use\s+\w+\s+for\s+username/i,
		tool: 'pingone_get_user',
	},
	{ pattern: /user.*groups?|groups?.*for.*user|what.*groups?.*user|user.*member/i, tool: 'pingone_get_user_groups' },
	{ pattern: /add.*user.*group|put.*user.*group|assign.*user.*group/i, tool: 'pingone_add_user_to_group' },
	{ pattern: /remov.*user.*group|tak.*user.*out.*group|unassign.*user.*group/i, tool: 'pingone_remove_user_from_group' },
	// groups
	{ pattern: /list.*group|show.*groups|all.*group|get.*groups/i, tool: 'pingone_list_groups' },
	{ pattern: /get\s+group|find\s+group|show\s+group\s+named?|group\s+details|group\s+info/i, tool: 'pingone_get_group' },
	{ pattern: /creat.*group|add.*group|new.*group/i, tool: 'pingone_create_group' },
	{ pattern: /delet.*group|remov.*group/i, tool: 'pingone_delete_group' },
	// populations
	{ pattern: /list.*pop|show.*pop|all.*pop|get.*pop/i, tool: 'pingone_list_populations' },
	// MFA
	{ pattern: /mfa.*device|device.*mfa|list.*device|show.*device|authenticat.*device/i, tool: 'pingone.mfa.devices.list' },
	{ pattern: /mfa.*polic|polic.*mfa|list.*mfa|show.*mfa.*polic/i, tool: 'pingone.mfa.policy.list' },
	// Subscriptions / webhooks
	{ pattern: /list.*subscri|show.*subscri|all.*subscri|webhooks?/i, tool: 'pingone_list_subscriptions' },
	{ pattern: /creat.*subscri|add.*subscri|new.*subscri|register.*webhook/i, tool: 'pingone_create_subscription' },
	{ pattern: /delet.*subscri|remov.*subscri|delete.*webhook/i, tool: 'pingone_delete_subscription' },
	// risk / org / OIDC / auth
	{ pattern: /risk.*eval|eval.*risk|risk.*score|assess.*risk/i, tool: 'pingone_risk_evaluation' },
	{ pattern: /oidc|openid|discovery|\.well-known|issuer/i, tool: 'pingone_oidc_config' },
	{ pattern: /introspect|inspect.*token|token.*info|validate.*token/i, tool: 'pingone_introspect_token' },
	// list tools (high priority patterns; also match "mcp tools", "MCP tools")
	{
		pattern:
			/\b(?:list|show|what|which)\s+(?:all\s+)?(?:mcp\s+)?tools?\b|\bavailable\s+(?:mcp\s+)?tools?\b|mcp\s+tools?\b/i,
		tool: 'mcp_list_tools',
	},
	// help
	{ pattern: /^help$|what can (you|i|we) do|what can.*look.?up|what commands|how do i (use|start|get start)|how can.*help|what.*can.*do.*chat|what.*user.*chat|chat.*user|what.*ping.*do|what.*look.*up.*ping/i, tool: 'ai_assistant_help' },
];

/** Returns the predicted MCP tool for a query, or null if no match. */
export function predictMcpTool(query: string): string | null {
	for (const { pattern, tool } of LOCAL_PATTERNS) {
		if (pattern.test(query)) return tool;
	}
	return null;
}

/** Returns true if the query looks like a PingOne MCP-actionable query. */
export function isMcpQuery(query: string): boolean {
	return predictMcpTool(query) !== null;
}

/** Returns true if the query is a help/capabilities request (works without credentials). */
export function isHelpQuery(query: string): boolean {
	return predictMcpTool(query) === 'ai_assistant_help';
}

/** Returns true if the query is asking to list all MCP tools (works without credentials). */
export function isListToolsQuery(query: string): boolean {
	return predictMcpTool(query) === 'mcp_list_tools';
}

/** Returns true if the query is a worker token request (works without the Live toggle). */
export function isWorkerTokenQuery(query: string): boolean {
	return predictMcpTool(query) === 'pingone_get_worker_token';
}

/**
 * Returns true when a query is asking for external documentation, specifications,
 * RFCs, standards, or general web search results that Brave Search can answer.
 * These queries auto-trigger web search even without the web toggle.
 */
export function isWebSearchQuery(query: string): boolean {
	const patterns = [
		/\bspec(?:ification)?s?\b/i,
		/\brfc\s*\d*/i,
		/\bstandard(?:s)?\b/i,
		/\bdraft\b/i,
		/\bdocumentation?\b/i,
		/\bdocs?\b/i,
		/\bsearch\s+(?:for|the)\b/i,
		/\blatest\s+version\b/i,
		/\bfind\s+(?:the\s+)?(?:article|page|link|resource|example|tutorial)\b/i,
		/\bshow\s+me\s+(?:the\s+)?(?:spec|rfc|standard|doc|link|page|article)\b/i,
		/\bwhere\s+(?:can\s+i|to)\s+(?:find|read|get|see)\b/i,
		/\blink\s+to\b/i,
		/\bhow\s+does.*work.*?\b(?:spec|standard|rfc|protocol)\b/i,
	];
	return patterns.some((p) => p.test(query));
}

// ── Educational token inspection utilities ────────────────────────────────────

/**
 * Decode a JWT payload without signature verification (educational display only).
 * Returns null if the string is not a valid JWT format.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
	try {
		const parts = token.split('.');
		if (parts.length < 2) return null;
		const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
		return JSON.parse(atob(padded)) as Record<string, unknown>;
	} catch {
		return null;
	}
}

/**
 * Decode the JWT header (alg, kid, typ) without signature verification (educational display only).
 * Returns null if the string is not a valid JWT format.
 */
export function decodeJwtHeader(token: string): Record<string, unknown> | null {
	try {
		const parts = token.split('.');
		if (parts.length < 2) return null;
		const base64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
		const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
		return JSON.parse(atob(padded)) as Record<string, unknown>;
	} catch {
		return null;
	}
}

/** Returns true when the query is asking to view/display the stored user access token. */
export function isShowMyTokenQuery(query: string): boolean {
	return /\bshow\s+(?:my\s+)?(?:user\s+)?(?:access\s+)?token\b|\bview\s+(?:my\s+)?(?:user\s+)?(?:access\s+)?token\b|\bdisplay\s+(?:my\s+)?(?:user\s+)?(?:access\s+)?token\b|\bwhat(?:'?s|\s+is)\s+my\s+(?:access\s+)?token\b/i.test(
		query.trim()
	);
}

/** Returns true when the query is asking to view/decode the stored ID token. */
export function isShowIdTokenQuery(query: string): boolean {
	return /\bshow\s+(?:my\s+)?id[\s-]token\b|\bview\s+(?:my\s+)?id[\s-]token\b|\bdisplay\s+(?:my\s+)?id[\s-]token\b|\bdecode\s+(?:my\s+)?id[\s-]token\b|\bid[\s-]token\s+claims?\b|\bwhat(?:'?s|\s+is)\s+in\s+(?:my\s+)?id[\s-]token\b/i.test(
		query.trim()
	);
}

/** Returns true when the query is asking to view/display the worker or admin token. */
export function isShowWorkerTokenQuery(query: string): boolean {
	return /\bshow\s+(?:the\s+)?(?:my\s+)?(?:worker|admin)\s+token\b|\bview\s+(?:the\s+)?(?:worker|admin)\s+token\b|\bdisplay\s+(?:the\s+)?(?:worker|admin)\s+token\b|\bwhat(?:'?s|\s+is)\s+(?:the\s+)?(?:worker|admin)\s+token\b/i.test(
		query.trim()
	);
}

/** Returns true when the query contains a pasted JWT to decode, or explicitly asks to decode a token. */
export function isDecodeTokenQuery(query: string): boolean {
	return (
		/\bdecode\s+(?:this\s+)?(?:jwt|token)\b|\bparse\s+(?:this\s+)?(?:jwt|token)\b|\bwhat\s+claims\s+(?:are\s+)?in\b/i.test(query.trim()) ||
		// freestanding JWT in the message text
		/\bey[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]{10,}\b/.test(query.trim())
	);
}

/** Returns true when the query is asking to view the recent MCP API call history. */
export function isShowApiCallsQuery(query: string): boolean {
	return /\bshow\s+(?:(?:my|the|recent|last)\s+)?api\s+calls?\b|\bapi\s+call\s+histor(?:y|ies)\b|\brecent\s+api\s+calls?\b|\blast\s+api\s+call\b|\bwhat\s+api\s+calls?\s+(?:were|have\s+been)\s+made\b|\bshow\s+(?:my\s+)?(?:last|recent)\s+calls?\b/i.test(
		query.trim()
	);
}

/** Returns true when the query is asking to clear all stored tokens from memory/localStorage. */
export function isClearTokensQuery(query: string): boolean {
	return /\bclear\s+(?:all\s+)?(?:my\s+)?(?:stored\s+)?tokens?\b|\bforget\s+(?:my\s+)?tokens?\b|\bremove\s+(?:my\s+)?(?:stored\s+)?tokens?\b|\bdelete\s+(?:my\s+)?(?:stored\s+)?tokens?\b|\bclear\s+token\s+storage\b|\bsign\s+out\s+tokens?\b/i.test(
		query.trim()
	);
}

/** Send the query to the backend MCP query handler and return the result. */
export async function callMcpQuery(
	query: string,
	options: McpQueryOptions = {}
): Promise<McpQueryResult> {
	const body: Record<string, unknown> = { query };
	if (options.workerToken) body.workerToken = options.workerToken;
	if (options.environmentId) body.environmentId = options.environmentId;
	if (options.region) body.region = options.region;
	if (options.userAccessToken) body.userAccessToken = options.userAccessToken;
	if (options.tokenToIntrospect) body.tokenToIntrospect = options.tokenToIntrospect;

	const response = await fetch('/api/mcp/query', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		// Try to extract structured error — server may include mcpTool/apiCall even on 5xx
		let err: Record<string, unknown> = {};
		const text = await response.text().catch(() => '');
		try {
			const json = text ? JSON.parse(text) : null;
			err = (typeof json === 'object' && json !== null ? json : {}) as Record<string, unknown>;
		} catch {
			// Body may be HTML; use plain text only if short and not HTML
			if (text && text.length < 500 && !/<\s*html/i.test(text)) {
				err = { answer: text };
			}
		}
		const msg =
			(typeof err?.answer === 'string' && err.answer.trim()) ||
			(typeof err?.error === 'string' && err.error.trim()) ||
			(typeof err?.error_description === 'string' && err.error_description.trim()) ||
			(typeof err?.message === 'string' && err.message.trim()) ||
			response.statusText;
		return {
			success: false,
			answer: `MCP query failed (${response.status}): ${msg}`,
			mcpTool: (err?.mcpTool as string) ?? null,
			apiCall: (err?.apiCall as { method: string; path: string }) ?? null,
			howItWorks: (err?.howItWorks as string) ?? null,
			data: null,
			error: msg,
		};
	}

	return response.json() as Promise<McpQueryResult>;
}

/** Returns true when the query is an Admin login request (open ROPC form). */
export function isAdminLoginQuery(query: string): boolean {
	return predictMcpTool(query) === 'admin_login';
}

/** Returns true when the query is asking to introspect the user's access token (not worker/admin). */
export function isIntrospectUserTokenQuery(query: string): boolean {
	return /\bintrospect\s+user\s+token\b|\bintrospect\s+user'?s?\s+token\b|user\s+token\s+introspect/i.test(
		query.trim()
	);
}

/** Returns true when the query is a UserInfo request (OIDC userinfo endpoint). */
export function isUserInfoQuery(query: string): boolean {
	return predictMcpTool(query) === 'pingone_userinfo';
}

/** Call backend to run pi.flow login + return a user access token (for introspection). */
export async function callUserTokenViaLogin(params: {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	username: string;
	password: string;
	region?: string;
}): Promise<{ success: boolean; access_token?: string; id_token?: string; expires_in?: number; error_description?: string }> {
	const res = await fetch('/api/mcp/user-token-via-login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({
			environmentId: params.environmentId,
			clientId: params.clientId,
			clientSecret: params.clientSecret,
			username: params.username,
			password: params.password,
			region: params.region || 'us',
		}),
	});
	const json = (await res.json()) as {
		success?: boolean;
		access_token?: string;
		id_token?: string;
		expires_in?: number;
		error_description?: string;
		error?: string;
	};
	if (!res.ok) {
		return {
			success: false,
			error_description: json.error_description || json.error || `Request failed (${res.status})`,
		};
	}
	return {
		success: !!json.success,
		access_token: json.access_token,
		id_token: json.id_token,
		expires_in: json.expires_in,
		error_description: json.error_description,
	};
}

/** Call backend to run pi.flow login + userinfo and return the result. */
export async function callUserInfoViaLogin(params: {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	username: string;
	password: string;
	region?: string;
}): Promise<{ success: boolean; data?: unknown; answer?: string; error_description?: string }> {
	const res = await fetch('/api/mcp/userinfo-via-login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({
			environmentId: params.environmentId,
			clientId: params.clientId,
			clientSecret: params.clientSecret,
			username: params.username,
			password: params.password,
			region: params.region || 'us',
		}),
	});
	const json = (await res.json()) as {
		success?: boolean;
		data?: unknown;
		answer?: string;
		error_description?: string;
		error?: string;
	};
	if (!res.ok) {
		return {
			success: false,
			error_description: json.error_description || json.error || `Request failed (${res.status})`,
		};
	}
	return {
		success: !!json.success,
		data: json.data,
		answer: json.answer,
		error_description: json.error_description,
	};
}

/** Send a query to the Brave Search MCP endpoint and return the result. */
export async function callMcpWebSearch(query: string): Promise<McpQueryResult> {
	const response = await fetch('/api/mcp/web-search', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({ query }),
	});

	if (!response.ok) {
		return {
			success: false,
			answer: `Web search failed (${response.status})`,
			mcpTool: 'brave_web_search',
			apiCall: { method: 'GET', path: 'https://api.search.brave.com/res/v1/web/search' },
			howItWorks: null,
			data: null,
		};
	}

	return response.json() as Promise<McpQueryResult>;
}
