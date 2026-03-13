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
	{ pattern: /worker.?token|client.?credentials|access.?token|get.?token|issue.?token/i, tool: 'pingone_get_worker_token' },
	// applications
	{ pattern: /list.*app|show.*app|get.*apps|all.*app|what.*app|fetch.*app/i, tool: 'pingone.applications.list' },
	{ pattern: /app.*secret|client\s+secret|show.*secret|secret.*app/i, tool: 'pingone_get_application_secret' },
	{ pattern: /rotate.*secret|regenerate.*secret|refresh.*client.*secret/i, tool: 'pingone_rotate_application_secret' },
	{ pattern: /creat.*app(?:lication)?|add.*app(?:lication)?|new.*app(?:lication)?|register.*app/i, tool: 'pingone_create_application' },
	{ pattern: /delet.*app(?:lication)?|remov.*app(?:lication)?/i, tool: 'pingone_delete_application' },
	{ pattern: /get\s+app|find\s+app|app\s+details|app\s+info|which\s+app/i, tool: 'pingone_get_application' },
	// users
	{ pattern: /list.*user|show.*users|all.*user|get.*users|fetch.*user/i, tool: 'pingone_list_users' },
	{ pattern: /get\s+user|find\s+user|look\s*up\s+user|show\s+user|user\s+info|who\s+is/i, tool: 'pingone_get_user' },
	{ pattern: /creat.*user|add.*user|new.*user|register.*user|onboard.*user/i, tool: 'pingone_create_user' },
	{ pattern: /delet.*user|remov.*user|deactivat.*user/i, tool: 'pingone_delete_user' },
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
	{ pattern: /licens|org.*licens|capacity/i, tool: 'pingone_get_organization_licenses' },
	{ pattern: /oidc|openid|discovery|\.well-known|issuer/i, tool: 'pingone_oidc_config' },
	{ pattern: /introspect|inspect.*token|token.*info|validate.*token/i, tool: 'pingone_introspect_token' },
	{ pattern: /userinfo|user\s+profile\s+claim|current.*user.*claim/i, tool: 'pingone_userinfo' },
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

/** Send the query to the backend MCP query handler and return the result. */
export async function callMcpQuery(
	query: string,
	options: McpQueryOptions = {}
): Promise<McpQueryResult> {
	const body: Record<string, unknown> = { query };
	if (options.workerToken) body.workerToken = options.workerToken;
	if (options.environmentId) body.environmentId = options.environmentId;
	if (options.region) body.region = options.region;

	const response = await fetch('/api/mcp/query', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		// Try to extract structured error — server may include mcpTool/apiCall even on 5xx
		const err = await response.json().catch(() => ({} as Record<string, unknown>));
		return {
			success: false,
			answer: `MCP query failed (${response.status}): ${(err.error_description as string) ?? (err.message as string) ?? response.statusText}`,
			mcpTool: (err.mcpTool as string) ?? null,
			apiCall: (err.apiCall as { method: string; path: string }) ?? null,
			howItWorks: (err.howItWorks as string) ?? null,
			data: null,
			error: (err.error_description as string) ?? response.statusText,
		};
	}

	return response.json() as Promise<McpQueryResult>;
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
