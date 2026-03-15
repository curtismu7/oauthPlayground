import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { aiAgentService } from '../services/aiAgentService';
import {
	getTokenStatus,
	refreshAndStoreToken,
	type WorkerTokenStatus,
} from '../services/aiAssistantWorkerTokenService';
import {
	callMcpQuery,
	callMcpWebSearch,
	callUserInfoViaLogin,
	callUserTokenViaLogin,
	decodeJwtHeader,
	decodeJwtPayload,
	isAdminLoginQuery,
	isClearTokensQuery,
	isDecodeTokenQuery,
	isMcpQuery,
	isHelpQuery,
	isIntrospectUserTokenQuery,
	isListToolsQuery,
	isShowApiCallsQuery,
	isShowIdTokenQuery,
	isShowMyTokenQuery,
	isShowWorkerTokenQuery,
	isUserInfoQuery,
	isWorkerTokenQuery,
	isWebSearchQuery,
	isAgentEducationQuery,
	isMcpExplainQuery,
	isMcpRolesQuery,
	isThisAgentExplainQuery,
	isMcpToolExplainQuery,
	isJsonRpcExplainQuery,
	isGroqExplainQuery,
	type McpQueryResult,
} from '../services/mcpQueryService';
import { callGroqStream, isGroqAvailable, type GroqMessage } from '../services/groqService';
import { saveMarkdown } from '../services/saveMarkdownService';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';

/** When true the assistant renders as a full-page app (no floating button, always open). */
export interface AIAssistantProps {
	/** Render as full-page layout instead of floating panel */
	fullPage?: boolean;
	/** Optional callback; standalone page uses this to open the OAuth login panel */
	onStartOAuthFlow?: (params: { authUrl: string; redirectUri: string }) => void;
}

// ─── localStorage persistence helpers ────────────────────────────────────────

const LS_MESSAGES_KEY = 'ai-assistant-messages';
const LS_TOGGLES_KEY = 'ai-assistant-toggles';
const LS_USER_TOKEN_KEY = 'ai-assistant-user-token';
const MESSAGE_TTL_MS = 30 * 60 * 1000; // 30 min

/** Friendly labels for prompt placeholders when asking the user for values. */
const PLACEHOLDER_LABELS: Record<string, string> = {
	'app-uuid': 'Application ID',
	'user-uuid': 'User ID',
	'group-uuid': 'Group ID',
	'sub-uuid': 'Subscription ID',
};

/** Extract unique placeholder keys from a template (e.g. "<app-uuid>" → "app-uuid"). */
function getPromptPlaceholders(template: string): string[] {
	const matches = template.matchAll(/<([^>]+)>/g);
	const keys = [...matches].map((m) => m[1]);
	return [...new Set(keys)];
}

interface Message {
	id: string;
	type: 'user' | 'assistant';
	content: string;
	links?: Array<{
		title: string;
		path: string;
		type: string;
		external?: boolean;
	}>;
	/** Populated when the message is an MCP live result */
	mcpResult?: McpQueryResult;
	/** Populated when the message has a Brave web search result */
	webResult?: McpQueryResult;
	/** Set when the Groq LLM answered this message */
	groqUsed?: boolean;
	/** True while tokens are still streaming in */
	streaming?: boolean;
	timestamp: Date;
}

/** A single recorded MCP API call (stored for "show api calls" command). */
interface ApiCallRecord {
	id: string;
	query: string;
	mcpTool: string | null;
	apiCall: { method: string; path: string } | null;
	data: unknown;
	timestamp: Date;
}

interface BraveResult {
	title: string;
	content: string;
	url: string;
}

// ─── Message text renderer ────────────────────────────────────────────────────
// Converts plain-text assistant output into formatted React nodes:
// blank lines → spacer, bullet lines (•/-/*) → flex bullet, **bold** and `code` inline.

function renderInline(text: string): React.ReactNode {
	const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
	return parts.map((part, i) => {
		if (part.startsWith('**') && part.endsWith('**')) {
			return <strong key={i}>{part.slice(2, -2)}</strong>;
		}
		if (part.startsWith('`') && part.endsWith('`')) {
			return (
				<code
					key={i}
					style={{
						background: 'rgba(0,0,0,0.08)',
						borderRadius: '3px',
						padding: '1px 4px',
						fontSize: '0.88em',
						fontFamily: "'SFMono-Regular', Consolas, monospace",
					}}
				>
					{part.slice(1, -1)}
				</code>
			);
		}
		return <React.Fragment key={i}>{part}</React.Fragment>;
	});
}

function renderMessageText(content: string): React.ReactNode {
	const lines = content.split('\n');
	return lines.map((line, i) => {
		if (!line.trim()) {
			return <div key={i} style={{ height: '4px' }} />;
		}
		const bulletMatch = line.match(/^(\s*)[•\-*]\s+(.+)$/);
		if (bulletMatch) {
			return (
				<div key={i} style={{ display: 'flex', gap: '6px', paddingLeft: '4px', marginTop: '2px' }}>
					<span style={{ flexShrink: 0, lineHeight: '1.5' }}>•</span>
					<span>{renderInline(bulletMatch[2])}</span>
				</div>
			);
		}
		return <div key={i}>{renderInline(line)}</div>;
	});
}

// ─── MCP data card renderer with paging ──────────────────────────────────────
const PAGE_SIZE = 10;

const McpDataPagedDisplay: React.FC<{ data: unknown[] }> = ({ data }) => {
	const [page, setPage] = useState(0);
	const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
	const start = page * PAGE_SIZE;
	const slice = data.slice(start, start + PAGE_SIZE);
	const first = slice[0];

	useEffect(() => {
		if (!data) return;
		setPage(0);
	}, [data]);

	if (typeof first !== 'object' || first === null) {
		const totalChunks = Math.ceil(data.length / PAGE_SIZE);
		const chunk = data.slice(start, start + PAGE_SIZE);
		return (
			<>
				<McpDataPre>
					{JSON.stringify(chunk, null, 2)}
				</McpDataPre>
				{data.length > PAGE_SIZE && (
					<McpPagination>
						<span>
							Showing {start + 1}–{Math.min(start + PAGE_SIZE, data.length)} of {data.length}
						</span>
						<McpPaginationButtons>
							<McpPageBtn
								type="button"
								onClick={() => setPage((p) => Math.max(0, p - 1))}
								disabled={page === 0}
							>
								← Prev
							</McpPageBtn>
							<span>
								Page {page + 1} of {totalChunks}
							</span>
							<McpPageBtn
								type="button"
								onClick={() => setPage((p) => Math.min(totalChunks - 1, p + 1))}
								disabled={page >= totalChunks - 1}
							>
								Next →
							</McpPageBtn>
						</McpPaginationButtons>
					</McpPagination>
				)}
			</>
		);
	}

	return (
		<>
			<McpDataItemList>
				{slice.map((item, idx) => {
					const obj = item as Record<string, unknown>;
					return (
						<McpDataItem key={start + idx}>
							{Object.entries(obj)
								.slice(0, 8)
								.map(([k, v]) => {
									let display: string;
									if (v === null || v === undefined) display = '–';
									else if (typeof v === 'object')
										display = Array.isArray(v) ? `[${(v as unknown[]).length} items]` : '{…}';
									else display = String(v).length > 60 ? `${String(v).slice(0, 60)}…` : String(v);
									return (
										<McpDataRow key={k}>
											<McpDataKey>{k}</McpDataKey>
											<McpDataVal>{display}</McpDataVal>
										</McpDataRow>
									);
								})}
						</McpDataItem>
					);
				})}
			</McpDataItemList>
			{data.length > PAGE_SIZE && (
				<McpPagination>
					<span>
						Showing {start + 1}–{Math.min(start + PAGE_SIZE, data.length)} of {data.length}
					</span>
					<McpPaginationButtons>
						<McpPageBtn
							type="button"
							onClick={() => setPage((p) => Math.max(0, p - 1))}
							disabled={page === 0}
						>
							← Prev
						</McpPageBtn>
						<span>
							Page {page + 1} of {totalPages}
						</span>
						<McpPageBtn
							type="button"
							onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
							disabled={page >= totalPages - 1}
						>
							Next →
						</McpPageBtn>
					</McpPaginationButtons>
				</McpPagination>
			)}
		</>
	);
};

/** Use admin token only when it expires more than this many ms in the future. */
const ADMIN_TOKEN_BUFFER_MS = 60_000;

const WELCOME_MESSAGE: Message = {
	id: '1',
	type: 'assistant',
	content:
		"Hi! I'm your OAuth Playground assistant. I can help you:\n\n• Find the right OAuth flow for your needs\n• Explain OAuth and OIDC concepts\n• Guide you through configuration\n• Troubleshoot issues\n\nWhat would you like to know?",
	timestamp: new Date(),
};

const AIAssistant: React.FC<AIAssistantProps> = ({ fullPage = false }) => {
	// In fullPage mode the window is always open and cannot be closed
	const [isOpen, setIsOpen] = useState(fullPage ? true : false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);

	// ── Toggle state — loaded from localStorage, saved on every change ─────────
	const [includeApiDocs, setIncludeApiDocs] = useState<boolean>(() => {
		try {
			return JSON.parse(localStorage.getItem(LS_TOGGLES_KEY) || '{}').includeApiDocs ?? false;
		} catch {
			return false;
		}
	});
	const [includeSpecs, setIncludeSpecs] = useState<boolean>(() => {
		try {
			return JSON.parse(localStorage.getItem(LS_TOGGLES_KEY) || '{}').includeSpecs ?? false;
		} catch {
			return false;
		}
	});
	const [includeWorkflows, setIncludeWorkflows] = useState<boolean>(() => {
		try {
			return JSON.parse(localStorage.getItem(LS_TOGGLES_KEY) || '{}').includeWorkflows ?? false;
		} catch {
			return false;
		}
	});
	const [includeUserGuide, setIncludeUserGuide] = useState<boolean>(() => {
		try {
			return JSON.parse(localStorage.getItem(LS_TOGGLES_KEY) || '{}').includeUserGuide ?? false;
		} catch {
			return false;
		}
	});
	const [includeWeb, setIncludeWeb] = useState<boolean>(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(LS_TOGGLES_KEY) || '{}');
			return saved.includeWeb !== undefined ? saved.includeWeb : true;
		} catch {
			return true;
		}
	});
	/** When true, PingOne-actionable queries are sent to /api/mcp/query for live results */
	const [includeLive, setIncludeLive] = useState<boolean>(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(LS_TOGGLES_KEY) || '{}');
			return saved.includeLive !== undefined ? saved.includeLive : true;
		} catch {
			return true;
		}
	});

	// ── Messages — loaded from localStorage (30-min TTL) ──────────────────────
	const [messages, setMessages] = useState<Message[]>(() => {
		try {
			const raw = localStorage.getItem(LS_MESSAGES_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (
					parsed.ts &&
					Date.now() - parsed.ts < MESSAGE_TTL_MS &&
					Array.isArray(parsed.messages)
				) {
					return parsed.messages.map((m: Message) => ({
						...m,
						timestamp: new Date(m.timestamp),
						content: m.content.replace('##LIVE_NUDGE##', '').trimEnd(),
					}));
				}
			}
		} catch {
			/* ignore */
		}
		return [WELCOME_MESSAGE];
	});

	const [input, setInput] = useState('');
	const [isTyping, setIsTyping] = useState(false);
	const [showRefreshTokenConfirm, setShowRefreshTokenConfirm] = useState(false);
	const [isRefreshingToken, setIsRefreshingToken] = useState(false);
	const [_workerTokenStatus, setWorkerTokenStatus] = useState<WorkerTokenStatus | null>(null);
	const [showPromptsGuide, setShowPromptsGuide] = useState(false);
	const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
	const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
	const [savedMessage, setSavedMessage] = useState<string | null>(null);

	/** When set, show modal to collect placeholder values; then fill prompt box with updated command. */
	const [placeholderFill, setPlaceholderFill] = useState<{ template: string; placeholders: string[] } | null>(null);
	/** Current values for each placeholder in the fill modal. */
	const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
	/** When true, show the Get userinfo login panel (username/password, pi.flow). */
	const [showUserInfoLogin, setShowUserInfoLogin] = useState(false);
	const [userinfoUsername, setUserinfoUsername] = useState('');
	const [userinfoPassword, setUserinfoPassword] = useState('');
	const [userinfoLoginError, setUserinfoLoginError] = useState<string | null>(null);
	const [userinfoLoginLoading, setUserinfoLoginLoading] = useState(false);
	/** Admin token (client credentials or ROPC) — when set and valid, MCP calls use it */
	const [adminToken, setAdminToken] = useState<string | null>(null);
	const [adminTokenExpiry, setAdminTokenExpiry] = useState<number | null>(null);
	const [adminEnvironmentId, setAdminEnvironmentId] = useState<string | null>(null);
	const [useAdminLogin, setUseAdminLogin] = useState(false);
	/** User access token from User login flow; used for "Introspect user token" */
	const [userAccessToken, setUserAccessToken] = useState<string | null>(null);
	/** ID token from User login flow (OIDC); stored for educational inspection */
	const [idToken, setIdToken] = useState<string | null>(null);
	/** Recent MCP API call records (last 20) — shown by "show api calls" command */
	const [apiCallHistory, setApiCallHistory] = useState<ApiCallRecord[]>([]);
	/** When true, show the User login panel (pi.flow) to get a user access token for introspection. */
	const [showUserTokenLogin, setShowUserTokenLogin] = useState(false);
	const [userTokenUsername, setUserTokenUsername] = useState('');
	const [userTokenPassword, setUserTokenPassword] = useState('');
	const [userTokenLoginError, setUserTokenLoginError] = useState<string | null>(null);
	const [userTokenLoginLoading, setUserTokenLoginLoading] = useState(false);
	/**
	 * null = not yet checked, true = Groq is ready, false = no API key configured
	 */
	const [groqAvailable, setGroqAvailable] = useState<boolean | null>(null);
	/**
	 * null = not yet checked, true = Brave Search is ready, false = no API key configured
	 */
	const [braveAvailable, setBraveAvailable] = useState<boolean | null>(null);
	/** Rolling window of the last 10 conversational turns for Groq context */
	const groqHistoryRef = useRef<GroqMessage[]>([]);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	// ── Scroll agent results to bottom when new content arrives ──────────────
	const scrollMessagesToBottom = useCallback((smooth = false) => {
		const el = messagesContainerRef.current;
		if (el) {
			if (smooth) {
				el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
			} else {
				el.scrollTop = el.scrollHeight;
			}
			setShowScrollDownHint(false);
		} else {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
		}
	}, []);

	// ── Persist messages to localStorage whenever they change ────────────────
	useEffect(() => {
		try {
			// Don't persist streaming messages
			const toSave = messages.map((m) => ({ ...m, streaming: undefined }));
			localStorage.setItem(LS_MESSAGES_KEY, JSON.stringify({ ts: Date.now(), messages: toSave }));
		} catch {
			/* storage quota exceeded — ignore */
		}
	}, [messages]);

	// ── Persist toggle states to localStorage whenever they change ───────────
	useEffect(() => {
		try {
			localStorage.setItem(
				LS_TOGGLES_KEY,
				JSON.stringify({
					includeApiDocs,
					includeSpecs,
					includeWorkflows,
					includeUserGuide,
					includeWeb,
					includeLive,
				})
			);
		} catch {
			/* ignore */
		}
	}, [includeApiDocs, includeSpecs, includeWorkflows, includeUserGuide, includeWeb, includeLive]);

	// ── Load stored user tokens from localStorage on mount ────────────────────
	useEffect(() => {
		try {
			const stored = localStorage.getItem(LS_USER_TOKEN_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as { access_token?: string; id_token?: string };
				if (typeof parsed.access_token === 'string') setUserAccessToken(parsed.access_token);
				if (typeof parsed.id_token === 'string') setIdToken(parsed.id_token);
			}
		} catch {
			// corrupted — ignore
		}
	}, []);

	useEffect(() => {
		if (messages.length === 0) return;
		scrollMessagesToBottom();
		const t = setTimeout(scrollMessagesToBottom, 150);
		return () => clearTimeout(t);
	}, [messages, scrollMessagesToBottom]);

	// Handle escape key to close AI assistant
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const tag = (event.target as HTMLElement)?.tagName;
			const isTyping =
				tag === 'INPUT' || tag === 'TEXTAREA' || (event.target as HTMLElement)?.isContentEditable;

			// Escape — close
			if (event.key === 'Escape' && isOpen) {
				setIsOpen(false);
				setIsExpanded(false);
				setIsCollapsed(false);
				return;
			}

			// Ctrl+/ or Cmd+/ — toggle open/closed
			if ((event.ctrlKey || event.metaKey) && event.key === '/') {
				event.preventDefault();
				setIsOpen((v) => !v);
				setIsCollapsed(false);
				return;
			}

			// Ctrl+Shift+A or Cmd+Shift+A — toggle open/closed (alt shortcut)
			if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
				if (isTyping) return;
				event.preventDefault();
				setIsOpen((v) => !v);
				setIsCollapsed(false);
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen]);

	// Load worker token status and credentials when assistant opens (credentials sync to mcp-config for MCP backend)
	useEffect(() => {
		if (!isOpen) return;
		getTokenStatus()
			.then(setWorkerTokenStatus)
			.catch(() => setWorkerTokenStatus(null));
		if (includeLive) {
			unifiedWorkerTokenService.loadCredentials().catch(() => {});
		}
	}, [isOpen, includeLive]);

	// Check Groq availability when assistant opens (or when it becomes open again)
	useEffect(() => {
		if (!isOpen) return;
		isGroqAvailable()
			.then(setGroqAvailable)
			.catch(() => setGroqAvailable(false));
		// Check backend first (key stored via env/disk), fall back to IndexedDB
		fetch('/api/api-key/brave-search')
			.then((r) => r.json())
			.then((data) => setBraveAvailable(data.success === true && !!data.apiKey))
			.catch(() => setBraveAvailable(false));
	}, [isOpen]);

	const handleRefreshTokenConfirm = useCallback(async () => {
		setIsRefreshingToken(true);
		try {
			await refreshAndStoreToken();
			setMessages((prev) => [
				...prev,
				{
					id: `token-refresh-${Date.now()}`,
					type: 'assistant',
					content:
						'New worker token obtained and saved to storage. You can continue using features that need it.',
					timestamp: new Date(),
				},
			]);
			setShowRefreshTokenConfirm(false);
			setWorkerTokenStatus(await getTokenStatus());
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			setMessages((prev) => [
				...prev,
				{
					id: `token-refresh-err-${Date.now()}`,
					type: 'assistant',
					content: `Could not get a new worker token: ${message}`,
					timestamp: new Date(),
				},
			]);
		} finally {
			setIsRefreshingToken(false);
		}
	}, []);

	const handleOpenRefreshTokenConfirm = useCallback(() => {
		setShowRefreshTokenConfirm(true);
	}, []);

	/** Store admin token; MCP calls use it until expiry or clear. */
	const handleAdminTokenSet = useCallback((token: string, expiresInSeconds: number, environmentId: string) => {
		setAdminToken(token);
		setAdminTokenExpiry(Date.now() + expiresInSeconds * 1000);
		setAdminEnvironmentId(environmentId);
	}, []);

	const handleAdminTokenClear = useCallback(() => {
		setAdminToken(null);
		setAdminTokenExpiry(null);
		setAdminEnvironmentId(null);
		setUseAdminLogin(false);
	}, []);

	/** Store user access token from User login flow; used for "Introspect user token". */
	const handleUserTokenSet = useCallback((token: string, expiresInSeconds: number, environmentId?: string, receivedIdToken?: string) => {
		setUserAccessToken(token);
		if (receivedIdToken !== undefined) setIdToken(receivedIdToken);
		// Persist to localStorage for educational inspection
		try {
			const record: { access_token: string; stored_at: number; id_token?: string } = {
				access_token: token,
				stored_at: Date.now(),
				...(receivedIdToken !== undefined ? { id_token: receivedIdToken } : {}),
			};
			localStorage.setItem(LS_USER_TOKEN_KEY, JSON.stringify(record));
		} catch { /* storage quota — ignore */ }
		// When in admin-login mode, also set the admin token so MCP calls use it
		if (environmentId) handleAdminTokenSet(token, expiresInSeconds, environmentId);
	}, [handleAdminTokenSet]);

	const handleUserTokenClear = useCallback(() => {
		setUserAccessToken(null);
		setIdToken(null);
		try { localStorage.removeItem(LS_USER_TOKEN_KEY); } catch { /* ignore */ }
		handleAdminTokenClear();
	}, [handleAdminTokenClear]);

	const handleCopyMessage = useCallback((id: string, content: string) => {
		navigator.clipboard.writeText(content).then(() => {
			setCopiedMessage(id);
			setTimeout(() => setCopiedMessage(null), 1800);
		});
	}, []);

	/** Prompts with placeholders (e.g. <app-uuid>) need user to fill in before sending. */
	const promptNeedsUserInput = useCallback((prompt: string) => /<[^>]+>/.test(prompt), []);

	/** Save assistant message as .md file to ~/.pingone-playground/ai-assistant-output/ */
	const handleSaveAsMarkdown = useCallback(async (id: string, content: string) => {
		const defaultName = `output-${new Date().toISOString().slice(0, 16).replace('T', '-').replace(/:/g, '')}.md`;
		const filename = window.prompt('Filename (e.g. my-plan.md):', defaultName)?.trim();
		if (!filename) return;
		const name = filename.endsWith('.md') ? filename : `${filename}.md`;
		const result = await saveMarkdown(content, name);
		if (result.success) {
			setSavedMessage(id);
			setTimeout(() => setSavedMessage(null), 2500);
		} else {
			window.alert(`Could not save: ${result.error}`);
		}
	}, []);

	const handleNewChat = useCallback(() => {
		setMessages([WELCOME_MESSAGE]);
		groqHistoryRef.current = [];
	}, []);

	const handleExportConversation = useCallback(() => {
		const lines: string[] = [
			'# AI Assistant Conversation',
			`*Exported: ${new Date().toLocaleString()}*`,
			'',
		];
		messages.forEach((m) => {
			if (m.streaming) return;
			const role = m.type === 'user' ? '**You**' : '**Assistant**';
			lines.push(`### ${role}  `);
			lines.push(m.content);
			if (m.mcpResult?.mcpTool) lines.push(`\n> 🔌 MCP: \`${m.mcpResult.mcpTool}\``);
			lines.push('');
		});
		const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `ai-assistant-${Date.now()}.md`;
		a.click();
		URL.revokeObjectURL(url);
	}, [messages]);

	/** Send a message. Pass overrideQuery when triggered by prompt chip/quick question to avoid stale closure. keepInInput: leave the sent text in the prompt box (e.g. when executing from an available-command button). */
	const handleSend = useCallback(async (overrideQuery?: string, options?: { keepInInput?: boolean }) => {
		const query = (overrideQuery ?? input).trim();
		if (!query) return;
		const userMessage: Message = {
			id: Date.now().toString(),
			type: 'user',
			content: query,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput(options?.keepInInput ? query : '');
		setIsTyping(true);

		// "Admin login" command
		if (isAdminLoginQuery(query)) {
			const tokenData = unifiedWorkerTokenService.getTokenDataSync();
			const hasConfig =
				tokenData?.credentials?.environmentId &&
				tokenData?.credentials?.clientId &&
				tokenData?.credentials?.clientSecret;
			setMessages((prev) => [
				...prev,
				{
					id: crypto.randomUUID(),
					type: 'assistant',
					content: hasConfig
						? '**Admin login** — opening the User login panel. Enter your admin username and password to get an admin access token for MCP commands like "list all users".'
						: 'To use **Admin login**, configure the PingOne OIDC client credentials (worker token) in **Configuration** first. You need an app with **Resource Owner Password** grant and Management API scopes.',
					timestamp: new Date(),
				},
			]);
			if (hasConfig) {
				setShowUserTokenLogin(true);
				setUserTokenLoginError(null);
				setUseAdminLogin(true);
			}
			setIsTyping(false);
			setInput(query);
			return;
		}

		// ── Client-side token inspection commands ────────────────────────────────────
		// These operate on locally-stored tokens — no backend call, no Live toggle needed.

		if (isShowMyTokenQuery(query)) {
			const msg = (() => {
				if (!userAccessToken) {
					return 'No user access token stored yet. Log in using **Admin login** or say **"Introspect user token"** to open the User login panel.';
				}
				const header = decodeJwtHeader(userAccessToken);
				const payload = decodeJwtPayload(userAccessToken);
				const parts: string[] = [`## 🔑 User Access Token\n\n\`\`\`\n${userAccessToken}\n\`\`\``];
				if (header) parts.push(`### Header\n\`\`\`json\n${JSON.stringify(header, null, 2)}\n\`\`\``);
				if (payload) parts.push(`### Claims\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``);
				parts.push('\n> ⚠️ **Educational only** — never store tokens in browser storage in production.');
				return parts.join('\n\n');
			})();
			setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: msg, timestamp: new Date() }]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		if (isShowIdTokenQuery(query)) {
			const msg = (() => {
				if (!idToken) {
					return 'No ID token stored. Log in as a user (say **"User login"** or **"Introspect user token"**) to receive an ID token alongside the access token.';
				}
				const header = decodeJwtHeader(idToken);
				const payload = decodeJwtPayload(idToken);
				const parts: string[] = [`## 🪪 ID Token\n\n\`\`\`\n${idToken}\n\`\`\``];
				if (header) parts.push(`### Header\n\`\`\`json\n${JSON.stringify(header, null, 2)}\n\`\`\``);
				if (payload) parts.push(`### Claims\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``);
				parts.push('\n> ℹ️ The ID Token asserts who the user is. It contains identity claims (sub, name, email) and is meant only for the client that requested it — never forward it to APIs.\n> ⚠️ **Educational only** — never store ID tokens in browser storage in production.');
				return parts.join('\n\n');
			})();
			setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: msg, timestamp: new Date() }]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		if (isShowWorkerTokenQuery(query)) {
			const useAdminTok = useAdminLogin && !!adminToken && adminTokenExpiry != null && Date.now() < adminTokenExpiry - ADMIN_TOKEN_BUFFER_MS;
			const tokenData = unifiedWorkerTokenService.getTokenDataSync();
			const token = useAdminTok ? adminToken : (tokenData?.token ?? null);
			const label = useAdminTok ? 'Admin Token' : 'Worker Token';
			const msg = (() => {
				if (!token) {
					return `No ${label.toLowerCase()} available. Say **"Get worker token"** to request one, or **"Admin login"** to sign in as admin.`;
				}
				const header = decodeJwtHeader(token);
				const payload = decodeJwtPayload(token);
				const parts: string[] = [`## 🔐 ${label}\n\n\`\`\`\n${token}\n\`\`\``];
				if (header) parts.push(`### Header\n\`\`\`json\n${JSON.stringify(header, null, 2)}\n\`\`\``);
				if (payload) parts.push(`### Claims\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``);
				parts.push('\n> ⚠️ **Educational only** — worker tokens are high-privilege. Never reveal them in production UIs.');
				return parts.join('\n\n');
			})();
			setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: msg, timestamp: new Date() }]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		if (isDecodeTokenQuery(query)) {
			const jwtMatch = query.match(/\bey[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]{10,}\b/);
			const tokenToDecode = jwtMatch?.[0] ?? null;
			const msg = (() => {
				if (!tokenToDecode) {
					return 'Paste a JWT in your message to decode it. Example:\n\n```\ndecode eyJhbGci...\n```';
				}
				const header = decodeJwtHeader(tokenToDecode);
				const payload = decodeJwtPayload(tokenToDecode);
				const truncated = tokenToDecode.length > 80 ? `${tokenToDecode.slice(0, 80)}…` : tokenToDecode;
				const parts: string[] = [`## 🔬 Decoded Token\n\n\`\`\`\n${truncated}\n\`\`\``];
				if (header) parts.push(`### Header\n\`\`\`json\n${JSON.stringify(header, null, 2)}\n\`\`\``);
				if (payload) parts.push(`### Payload Claims\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``);
				if (!header && !payload) parts.push('⚠️ Could not decode — this may not be a standard JWT.');
				parts.push('\n> ℹ️ JWT decode is client-side base64 only — no signature verification. For **educational inspection** only.');
				return parts.join('\n\n');
			})();
			setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: msg, timestamp: new Date() }]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		if (isShowApiCallsQuery(query)) {
			const msg = (() => {
				if (apiCallHistory.length === 0) {
					return 'No API calls recorded yet. Execute a live MCP command (e.g. **List all users**) first.';
				}
				const records = [...apiCallHistory].reverse().slice(0, 5);
				const parts: string[] = ['## 📡 Recent API Calls'];
				records.forEach((rec, i) => {
					parts.push(`### ${i + 1}. ${rec.mcpTool ?? 'Unknown tool'}\n**Query:** ${rec.query}`);
					if (rec.apiCall) parts.push(`**API Call:** \`${rec.apiCall.method} ${rec.apiCall.path}\``);
					if (rec.data !== null && rec.data !== undefined) {
						const json = JSON.stringify(rec.data, null, 2);
						parts.push(`**Response:**\n\`\`\`json\n${json.length > 2000 ? `${json.slice(0, 2000)}\n…(truncated)` : json}\n\`\`\``);
					}
				});
				return parts.join('\n\n');
			})();
			setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: msg, timestamp: new Date() }]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		if (isClearTokensQuery(query)) {
			setUserAccessToken(null);
			setIdToken(null);
			setAdminToken(null);
			setAdminTokenExpiry(null);
			setAdminEnvironmentId(null);
			try { localStorage.removeItem(LS_USER_TOKEN_KEY); } catch { /* ignore */ }
			setMessages((prev) => [
				...prev,
				{
					id: crypto.randomUUID(),
					type: 'assistant',
					content: '🗑️ **Tokens cleared.** User access token, ID token, and admin token have been removed from memory and localStorage.\n\n> Note: The worker token (managed in Configuration) is not affected.',
					timestamp: new Date(),
				},
			]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		// ── AI / MCP education commands (client-side, always work, no Live needed) ───

		if (isAgentEducationQuery(query)) {
			const msg = [
				'## What is an AI Agent? 🤖',
				'',
				'An **AI agent** is a system that can *perceive*, *reason*, and *act* — going beyond simple question-answering.',
				'',
				'### Three properties of an agent',
				'| Property | What it means | In this app |',
				'|----------|---------------|-------------|',
				'| **Perception** | Reads input, history, tool results | Your message → `handleSend()` → intent classifier |',
				'| **Reasoning** | Decides what to do next | `mcpQueryService.ts` predicates + Groq (Llama 3.3 70B) |',
				'| **Action** | Calls tools, APIs, or responds | `POST /api/mcp/query` → PingOne REST API |',
				'',
				'### This app is a working agent',
				'When you type **"List all users"**, the agent:',
				'1. Classifies it as an MCP query (`isMcpQuery()` → `true`)',
				'2. Checks the Live toggle (won\'t simulate data)',
				'3. POSTs to `/api/mcp/query` → calls PingOne → real user list returned',
				'4. Displays the 🔌 MCP card with method, path, and raw data',
				'',
				'### Why agents matter',
				'Agents can chain tool calls autonomously. This agent handles 71 MCP tools: users, groups, MFA, tokens, OIDC, decode JWT, and more.',
				'',
				'💡 Try: **"What is MCP?"** — the standard that connects agents to tools.',
				'💡 Try: **"How does this agent work?"** — see the full implementation.',
				'💡 Try: **"List all users"** — watch the agent make a real API call.',
			].join('\n');
			setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: msg, timestamp: new Date() }]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		if (isMcpExplainQuery(query)) {
			const msg = [
				'## Model Context Protocol (MCP) 🔌',
				'',
				'MCP is an **open standard** (Anthropic, Nov 2024) that lets AI applications connect to external tools and data sources in a standardized way.',
				'',
				'### The problem it solves',
				'Before MCP, every AI app needed custom integrations per tool. MCP is "USB-C for AI" — one standard protocol, any tool or AI can plug in.',
				'',
				'### Our implementation',
				'```',
				'pingone-mcp-server/',
				'├── src/index.ts          ← registers 71 tools with @modelcontextprotocol/sdk',
				'├── src/actions/',
				'│   ├── users.ts          ← pingone_list_users, pingone_get_user, ...',
				'│   ├── tokenUtils.ts     ← pingone_decode_jwt (educational, no network)',
				'│   ├── introspect.ts     ← pingone_introspect_token (RFC 7662)',
				'│   └── oidc.ts           ← pingone_oidc_config, pingone_oidc_discovery',
				'└── src/services/         ← PingOne REST API clients',
				'```',
				'',
				'### How the connection works',
				'1. `pingone-mcp-server` runs as a **stdio process** (TypeScript → Node.js)',
				'2. Communicates via **JSON-RPC 2.0** over stdin/stdout',
				'3. Backend (`server.js`) connects to it, proxies calls via `/api/mcp/query`',
				'4. You ask "List users" → backend sends `tools/call` → server calls PingOne → result returned',
				'',
				'### The spec',
				'- Transport: `stdio` (our server) or HTTP/SSE (web servers)',
				'- Protocol: JSON-RPC 2.0',
				'- Features: tools, resources, prompts, sampling',
				'- SDK: `@modelcontextprotocol/sdk` (npm)',
				'',
				'💡 Try: **"List MCP tools"** — calls the actual MCP server right now.',
				'💡 Try: **"Explain MCP host, client, server"** — the three roles.',
				'💡 Try: **"What is a tool call?"** — see the JSON-RPC message format.',
			].join('\n');
			setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: msg, timestamp: new Date() }]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		if (isMcpRolesQuery(query)) {
			const msg = [
				'## MCP: Host, Client, Server 🏗️',
				'',
				'The Model Context Protocol defines three distinct roles in every AI integration.',
				'',
				'### 🖥️ Host',
				'The **host** is the application that runs the AI and manages MCP server connections.',
				'',
				'Examples: Claude Desktop, VS Code (with Copilot + MCP extensions)',
				'**Our host**: This MasterFlow app (React frontend + Express backend in `server.js`)',
				'',
				'The host decides: which servers to spawn, when to invoke tools, what to show the user.',
				'',
				'### 🔗 Client',
				'The **client** is the MCP connection embedded in the host — one connection per server.',
				'',
				'In our code:',
				'- `server.js` acts as the MCP client',
				'- It spawns `pingone-mcp-server` as a child stdio process',
				'- It sends `tools/list` and `tools/call` JSON-RPC messages via stdin',
				'',
				'### 🔧 Server',
				'The **server** exposes tools, resources, and prompts to the client.',
				'',
				'Ours: `pingone-mcp-server/` (TypeScript, stdio transport)',
				'- Responds to `tools/list` → returns 71 tool definitions',
				'- Handles `tools/call { name: "pingone_list_users", arguments: {...} }`',
				'- Each tool: validates with Zod → calls PingOne REST API → returns structured content',
				'',
				'### Visual overview',
				'```',
				'Host (MasterFlow app)',
				'  └── Client (server.js MCP client)',
				'           └── [stdio / JSON-RPC 2.0] Server (pingone-mcp-server)',
				'                                               └── [HTTPS] PingOne REST API',
				'',
				'User → React UI → POST /api/mcp/query → client → server → PingOne',
				'```',
				'',
				'💡 MCP spec: https://modelcontextprotocol.io',
				'💡 Try: **"What is JSON-RPC?"** — the protocol that connects client and server.',
			].join('\n');
			setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: msg, timestamp: new Date() }]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		if (isThisAgentExplainQuery(query)) {
			const msg = [
				'## How This Agent Works 🤖➡️🔌➡️🌐',
				'',
				'Here is the exact flow when you send a message:',
				'',
				'### 1. Intent Classification (browser, `mcpQueryService.ts`)',
				'Your query is tested against a series of predicates:',
				'- `isShowMyTokenQuery()` / `isDecodeTokenQuery()` → **client-side** (no network)',
				'- `isMcpExplainQuery()` / `isAgentEducationQuery()` → **built-in answer** (like this one)',
				'- `isMcpQuery()` → **MCP backend call**',
				'- `isWorkerTokenQuery()` / `isHelpQuery()` → **special handlers**',
				'- Everything else → **Groq LLM**',
				'',
				'### 2. MCP Bridge (Express `server.js` → `pingone-mcp-server`)',
				'```',
				'POST /api/mcp/query { query, workerToken, environmentId }',
				'  ↓ classifyMcpIntent() matches your query against MCP_INTENTS patterns',
				'  ↓ fetches worker token (client_credentials grant to /as/token)',
				'  ↓ calls the right PingOne REST API endpoint',
				'  ↓ returns { answer, mcpTool, apiCall, howItWorks, data }',
				'```',
				'The 🔌 MCP card in responses shows: tool name, HTTP method+path, and raw data.',
				'',
				'### 3. Groq LLM (for AI / knowledge questions)',
				'- Provider: `api.groq.com`',
				'- Model: `llama-3.3-70b-versatile` (Meta Llama 3.3 70B)',
				'- System prompt: "You are MasterFlow Agent, expert on OAuth, OIDC, PingOne, and MCP"',
				'- Used for: open questions, explanations, OAuth/OIDC concepts',
				'',
				'### 4. Token Inspector (fully in-browser)',
				'Decode/view commands never leave the browser:',
				'- `isShowMyTokenQuery` → display `localStorage["ai-assistant-user-token"]`',
				'- `isDecodeTokenQuery` → `atob()` decode the JWT segments inline',
				'',
				'### Key files',
				'| File | Role |',
				'|------|------|',
				'| `src/services/mcpQueryService.ts` | Intent predicates |',
				'| `src/components/AIAssistant.tsx` | `handleSend()` orchestrator |',
				'| `server.js` `/api/mcp/query` | MCP intent dispatch |',
				'| `pingone-mcp-server/src/index.ts` | MCP tool registration |',
				'| `pingone-mcp-server/src/actions/` | PingOne API implementations |',
				'',
				'💡 Try: **"Show agent architecture"** — see the full stack diagram.',
				'💡 Try: **"List all users"** — watch a real API call happen.',
			].join('\n');
			setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: msg, timestamp: new Date() }]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		if (/\bshow\s+agent\s+architecture\b/i.test(query.trim())) {
			const msg = [
				'## Agent Architecture 🏗️',
				'',
				'```',
				'┌──────────────────────────────────────────────────────┐',
				'│  Browser (React 18 + TypeScript + styled-components)  │',
				'│                                                       │',
				'│  AIAssistant.tsx  handleSend(query)                  │',
				'│   ├─ mcpQueryService.ts  classify intent             │',
				'│   │                                                   │',
				'│   ├─ TOKEN queries ──────────────── client-side      │',
				'│   │   atob() decode, localStorage, no network        │',
				'│   │                                                   │',
				'│   ├─ EDUCATION queries ─────────── built-in answers  │',
				'│   │   (this response — no API needed)                │',
				'│   │                                                   │',
				'│   ├─ AI KNOWLEDGE queries ───────── Groq API         │',
				'│   │   POST api.groq.com  ←  Llama 3.3 70B           │',
				'│   │                                                   │',
				'│   └─ MCP queries ────────────────── backend bridge   │',
				'│       POST /api/mcp/query                            │',
				'└────────────────────┬─────────────────────────────────┘',
				'                     │ HTTP / JSON',
				'┌────────────────────▼─────────────────────────────────┐',
				'│  server.js (Node.js / Express)                       │',
				'│                                                       │',
				'│  /api/mcp/query                                       │',
				'│   classifyMcpIntent()  ← MCP_INTENTS regex array    │',
				'│   ├─ list_tools   → read tool-names.json             │',
				'│   ├─ worker_token → POST /as/token (CC grant)        │',
				'│   ├─ list_users   → MCP tools/call                  │',
				'│   ├─ introspect   → POST /as/introspect (RFC 7662)  │',
				'│   └─ decode_token → base64url decode (no network)    │',
				'│                │                                     │',
				'│                │ stdin/stdout  JSON-RPC 2.0          │',
				'│  ┌─────────────▼──────────────────────────────────┐ │',
				'│  │  pingone-mcp-server (TypeScript stdio process)  │ │',
				'│  │  71 tools  ·  Zod validation  ·  PingOne SDK   │ │',
				'│  └──────────────────────┬─────────────────────────┘ │',
				'└─────────────────────────┼────────────────────────────┘',
				'                          │ HTTPS',
				'                          ▼',
				'          api.pingone.com  (PingOne REST API)',
				'```',
				'',
				'### Tech stack',
				'- **Frontend**: React 18 · TypeScript · styled-components · Vite',
				'- **Backend**: Node.js 20 · Express · native fetch',
				'- **MCP**: `@modelcontextprotocol/sdk` · stdio transport · JSON-RPC 2.0',
				'- **LLM**: Groq API · `llama-3.3-70b-versatile`',
				'- **Identity**: PingOne (users · groups · MFA · apps · tokens · OIDC)',
			].join('\n');
			setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: msg, timestamp: new Date() }]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		if (isMcpToolExplainQuery(query)) {
			const msg = [
				'## What is an MCP Tool Call? 🔧',
				'',
				'A **tool call** is how an AI agent executes a specific action — like calling a REST API.',
				'',
				'### The JSON-RPC request',
				'When you ask "List all users", the backend sends this to our MCP server:',
				'```json',
				'{',
				'  "jsonrpc": "2.0",',
				'  "id": 1,',
				'  "method": "tools/call",',
				'  "params": {',
				'    "name": "pingone_list_users",',
				'    "arguments": { "environmentId": "your-env-id", "limit": 20 }',
				'  }',
				'}',
				'```',
				'',
				'### What the MCP server does',
				'1. Validates arguments with **Zod** schema (rejects early if invalid)',
				'2. Fetches or reuses a cached **worker token** (client_credentials grant)',
				'3. Calls `GET https://api.pingone.com/v1/environments/{envId}/users`',
				'4. Returns structured content:',
				'```json',
				'{',
				'  "content": [{ "type": "text", "text": "Found 42 users..." }],',
				'  "structuredContent": { "success": true, "count": 42, "users": [...] }',
				'}',
				'```',
				'',
				'### Where our tools live',
				'```',
				'pingone-mcp-server/src/actions/',
				'├── users.ts        ← pingone_list_users, pingone_get_user, pingone_create_user',
				'├── groups.ts       ← pingone_list_groups, pingone_create_group',
				'├── mfa.ts          ← pingone_list_mfa_policies',
				'├── tokenUtils.ts   ← pingone_decode_jwt  (no network, pure base64url)',
				'├── introspect.ts   ← pingone_introspect_token (RFC 7662)',
				'└── oidc.ts         ← pingone_oidc_config, pingone_oidc_discovery',
				'```',
				'',
				'💡 Try: **"List MCP tools"** — retrieves all 71 available tools from the server.',
				'💡 Try: **"List all users"** — executes a real `tools/call` right now.',
			].join('\n');
			setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: msg, timestamp: new Date() }]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		if (isJsonRpcExplainQuery(query)) {
			const msg = [
				'## What is JSON-RPC 2.0? 📡',
				'',
				'**JSON-RPC 2.0** is the wire protocol MCP uses between the host/client and the server.',
				'',
				'### Why JSON-RPC?',
				'- Simple request/response over any transport (stdio, HTTP, WebSocket)',
				'- Client assigns `id`; server echoes it back — easy to match async responses',
				'- Standard error codes (-32600 parse error, -32602 invalid params, etc.)',
				'',
				'### Request',
				'```json',
				'{',
				'  "jsonrpc": "2.0",',
				'  "id": 42,',
				'  "method": "tools/list",',
				'  "params": {}',
				'}',
				'```',
				'',
				'### Successful response',
				'```json',
				'{',
				'  "jsonrpc": "2.0",',
				'  "id": 42,',
				'  "result": {',
				'    "tools": [',
				'      { "name": "pingone_list_users", "description": "...", "inputSchema": {} },',
				'      { "name": "pingone_decode_jwt",  "description": "...", "inputSchema": {} }',
				'    ]',
				'  }',
				'}',
				'```',
				'',
				'### Error response',
				'```json',
				'{',
				'  "jsonrpc": "2.0",',
				'  "id": 42,',
				'  "error": { "code": -32602, "message": "Invalid params", "data": "environmentId required" }',
				'}',
				'```',
				'',
				'### Our transport',
				'`pingone-mcp-server` uses **stdio** — the simplest MCP transport:',
				'- Client writes JSON-RPC to server **stdin**',
				'- Server writes responses to **stdout**',
				'- Errors go to **stderr** (never mixed with RPC output)',
				'',
				'In `pingone-mcp-server/src/index.ts`:',
				'```typescript',
				'const transport = new StdioServerTransport();',
				'await server.connect(transport);',
				'```',
			].join('\n');
			setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: msg, timestamp: new Date() }]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		if (isGroqExplainQuery(query)) {
			const msg = [
				'## How Does Groq Fit In? ⚡',
				'',
				'**Groq** is the LLM inference provider powering this agent\'s natural language understanding.',
				'',
				'### What Groq provides',
				'- **API**: `api.groq.com/openai/v1/chat/completions`',
				'- **Model**: `llama-3.3-70b-versatile` (Meta Llama 3.3, 70 billion parameters)',
				'- **Speed**: ~300+ tokens/sec — significantly faster than OpenAI for comparable capability',
				'- **Compatibility**: OpenAI-compatible request/response format',
				'',
				'### When we use Groq vs MCP',
				'| Query | Path |',
				'|-------|------|',
				'| "What is PKCE?" | → Groq (open knowledge question) |',
				'| "Explain OAuth 2.0 flows" | → Groq (educational) |',
				'| "List all users" | → MCP (PingOne API call — no Groq needed) |',
				'| "Show my token" | → Client-side (no Groq, no network) |',
				'| "What is an agent?" | → Built-in answer (this response type) |',
				'',
				'### System prompt we send to Groq',
				'```',
				'You are MasterFlow Agent — an expert on OAuth 2.0, OIDC, PingOne Identity,',
				'and Model Context Protocol (MCP). Help developers understand identity and AI integration.',
				'```',
				'',
				'### Without Groq',
				'If Groq is not configured, the agent still handles 100% of MCP/PingOne operations. Groq is only needed for open-ended AI/knowledge questions.',
				'',
				'💡 The **⚡ Groq** status dot in the header shows connection state.',
				'💡 Add your key in **Configuration → AI Keys**.',
			].join('\n');
			setMessages((prev) => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: msg, timestamp: new Date() }]);
			setIsTyping(false);
			setInput(query);
			return;
		}

		// Worker-token and help queries always go to MCP.
		// Any PingOne-actionable query (isMcpQuery) with Live ON → MCP for real data.
		// Any PingOne-actionable query with Live OFF → show a helpful "turn on Live" nudge
		// rather than letting Groq fake the response with invented data.
		if (isMcpQuery(query) && !includeLive && !isWorkerTokenQuery(query) && !isHelpQuery(query) && !isListToolsQuery(query)) {
			setMessages((prev) => [
				...prev,
				{
					id: crypto.randomUUID(),
					type: 'assistant',
					content:
						"🔌 **Live MCP is off.**\n\nTurn on the **Live** toggle in the header to execute this command against your real PingOne environment.\n\nI won't guess or simulate PingOne data — only the MCP tool can return real results.",
					timestamp: new Date(),
				},
			]);
			setIsTyping(false);
			setInput(query); // Restore executed command so user can modify and re-run
			return;
		}

		// "Introspect user token": open user login panel if no user token yet
		if (isIntrospectUserTokenQuery(query) && includeLive && !userAccessToken) {
			setMessages((prev) => [
				...prev,
				{
					id: crypto.randomUUID(),
					type: 'assistant',
					content:
						'**Introspect user token** — sign in first to get a user access token. Use the login panel that just opened.',
					timestamp: new Date(),
				},
			]);
			setShowUserTokenLogin(true);
			setUserTokenLoginError(null);
			setIsTyping(false);
			setInput(query);
			return;
		}

		// Get userinfo: show login panel (Authorization Code flow, response_mode=pi.flow) then call userinfo
		if (isUserInfoQuery(query) && includeLive) {
			setMessages((prev) => [
				...prev,
				{
					id: crypto.randomUUID(),
					type: 'assistant',
					content:
						'**Get userinfo** uses the OIDC UserInfo (end-user info) endpoint. Sign in in the side panel; we use the **user access token** from the auth call to call that endpoint and show your claims here.',
					timestamp: new Date(),
				},
			]);
			setShowUserInfoLogin(true);
			setUserinfoLoginError(null);
			setIsTyping(false);
			return;
		}

		if (isWorkerTokenQuery(query) || isHelpQuery(query) || isListToolsQuery(query) || (includeLive && isMcpQuery(query))) {
			try {
				// Pull stored credentials from our storage service (IndexedDB + SQLite)
				const tokenData = unifiedWorkerTokenService.getTokenDataSync();
				const useAdminToken =
					useAdminLogin &&
					!!adminToken &&
					adminTokenExpiry != null &&
					Date.now() < adminTokenExpiry - ADMIN_TOKEN_BUFFER_MS;
				const useUserTokenForIntrospect = isIntrospectUserTokenQuery(query) && !!userAccessToken;
				const mcpResult = await callMcpQuery(query, {
					workerToken: useAdminToken ? adminToken! : (tokenData?.token || undefined),
					environmentId: useAdminToken
						? (adminEnvironmentId || undefined)
						: (tokenData?.credentials?.environmentId || undefined),
					region: (tokenData?.credentials?.region as string) || undefined,
					...(useUserTokenForIntrospect && userAccessToken
						? { tokenToIntrospect: userAccessToken }
						: {}),
				});
				const assistantMessage: Message = {
					id: crypto.randomUUID(),
					type: 'assistant',
					content: mcpResult.answer,
					mcpResult,
					timestamp: new Date(),
				};
				// Track in API call history (for "show api calls" command)
				if (mcpResult.apiCall) {
					setApiCallHistory((prev) => [
						...prev.slice(-19),
						{ id: crypto.randomUUID(), query, mcpTool: mcpResult.mcpTool, apiCall: mcpResult.apiCall, data: mcpResult.data, timestamp: new Date() },
					]);
				}
				setMessages((prev) => [...prev, assistantMessage]);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				setMessages((prev) => [
					...prev,
					{
						id: crypto.randomUUID(),
						type: 'assistant',
						content: `MCP query failed: ${message}`,
						timestamp: new Date(),
					},
				]);
			} finally {
				setIsTyping(false);
				setInput(query); // Restore executed command so user can modify and re-run
			}
			return;
		}

		// All other queries: Groq streams the answer token-by-token, then we optionally
		// attach a live MCP data card (Live toggle) and/or Brave web results.
		const streamingId = crypto.randomUUID();

		// Add an empty placeholder that will be filled by streaming tokens
		setMessages((prev) => [
			...prev,
			{ id: streamingId, type: 'assistant', content: '', streaming: true, timestamp: new Date() },
		]);
		setIsTyping(false); // The animated dots yield to the streaming cursor

		let streamedContent = '';
		let groqUsed = false;
		let usedFallback = false;

		try {
			await callGroqStream(
				query,
				groqHistoryRef.current,
				(token) => {
					streamedContent += token;
					setMessages((prev) =>
						prev.map((m) => (m.id === streamingId ? { ...m, content: streamedContent } : m))
					);
				},
				(finalContent) => {
					streamedContent = finalContent;
					groqUsed = true;
					groqHistoryRef.current = [
						...groqHistoryRef.current,
						{ role: 'user', content: query },
						{ role: 'assistant', content: finalContent },
					].slice(-20) as GroqMessage[];
				},
				(err) => {
					// Groq stream failed — fall back to local KB answer
					usedFallback = true;
					const { answer } = aiAgentService.getAnswer(query, {
						includeApiDocs,
						includeSpecs,
						includeWorkflows,
						includeUserGuide,
					});
					streamedContent = answer;
					console.warn('[AIAssistant] Groq stream error, using local fallback:', err.message);
				},
				{ includeLive }
			);
		} catch {
			usedFallback = true;
			const { answer } = aiAgentService.getAnswer(query, {
				includeApiDocs,
				includeSpecs,
				includeWorkflows,
				includeUserGuide,
			});
			streamedContent = answer;
		}

		// Finalise the streaming message content so it renders cleanly
		setMessages((prev) =>
			prev.map((m) =>
				m.id === streamingId ? { ...m, content: streamedContent, streaming: false, groqUsed } : m
			)
		);

		const localResult =
			!groqUsed || usedFallback
				? aiAgentService.getAnswer(query, {
						includeApiDocs,
						includeSpecs,
						includeWorkflows,
						includeUserGuide,
					})
				: null;
		const links: Array<{ title: string; path: string; type: string; external?: boolean }> = (
			localResult?.relatedLinks ?? []
		).map((link) => ({
			title: link.title,
			path: link.path,
			type: link.type,
			external: link.external,
		}));

		// NOTE: isMcpQuery() requests never reach this code path — they're routed
		// to the MCP-only branch above. The Groq path only handles conceptual/
		// conversational questions, so no secondary MCP call is needed here.

		let webResult: McpQueryResult | undefined;
		if (includeWeb || isWebSearchQuery(query)) {
			try {
				webResult = await callMcpWebSearch(query);
			} catch {
				// Web search failed; keep local results only
			}
		}

		// Attach web / links to the finalised message
		setMessages((prev) => prev.map((m) => (m.id === streamingId ? { ...m, links, webResult } : m)));
	}, [
		input,
		includeApiDocs,
		includeSpecs,
		includeWorkflows,
		includeUserGuide,
		includeWeb,
		includeLive,
		useAdminLogin,
		adminToken,
		adminTokenExpiry,
		adminEnvironmentId,
		userAccessToken,
		idToken,
		apiCallHistory,
	]);

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	/** Handle prompt/command button click: if placeholders, ask for values then fill; else put in input and execute. */
	const handlePromptClick = useCallback(
		(prompt: string, closeGuide?: boolean) => {
			if (closeGuide) setShowPromptsGuide(false);
			setInput(prompt);
			if (promptNeedsUserInput(prompt)) {
				const placeholders = getPromptPlaceholders(prompt);
				setPlaceholderFill({ template: prompt, placeholders });
				setPlaceholderValues(Object.fromEntries(placeholders.map((k) => [k, ''])));
			} else {
				handleSend(prompt, { keepInInput: true });
			}
		},
		[promptNeedsUserInput, handleSend]
	);

	/** Build filled command from template and placeholder values; put in prompt box and optionally send. */
	const handlePlaceholderFillSubmit = useCallback(
		(andSend: boolean) => {
			if (!placeholderFill) return;
			let filled = placeholderFill.template;
			placeholderFill.placeholders.forEach((key) => {
				const value = placeholderValues[key]?.trim() ?? '';
				filled = filled.replace(new RegExp(`<${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}>`, 'g'), value);
			});
			setInput(filled);
			setPlaceholderFill(null);
			setPlaceholderValues({});
			if (andSend && filled.trim()) handleSend(filled, { keepInInput: true });
		},
		[placeholderFill, placeholderValues, handleSend]
	);

	const handleLinkClick = (path: string, external?: boolean) => {
		if (external) {
			window.open(path, '_blank', 'noopener,noreferrer');
		} else {
			navigate(path);
			setIsOpen(false);
		}
	};

	/** Submit Get userinfo login (Authorization Code flow, response_mode=pi.flow); on success add result to chat and close panel. */
	const handleUserInfoLoginSubmit = useCallback(async () => {
		const username = userinfoUsername.trim();
		const password = userinfoPassword;
		if (!username || !password) {
			setUserinfoLoginError('Please enter username and password.');
			return;
		}
		const tokenData = unifiedWorkerTokenService.getTokenDataSync();
		const creds = tokenData?.credentials;
		if (!creds?.environmentId || !creds?.clientId || !creds?.clientSecret) {
			setUserinfoLoginError('Save worker token credentials first (Configuration → MCP Server Config).');
			return;
		}
		setUserinfoLoginError(null);
		setUserinfoLoginLoading(true);
		try {
			const result = await callUserInfoViaLogin({
				environmentId: creds.environmentId,
				clientId: creds.clientId,
				clientSecret: creds.clientSecret,
				username,
				password,
				region: (creds.region as string) || 'us',
			});
			if (result.success && result.data != null) {
				const mcpResult: McpQueryResult = {
					success: true,
					answer: result.answer ?? `Retrieved OIDC userinfo: sub=${(result.data as { sub?: string })?.sub ?? '(unknown)'}.`,
					mcpTool: 'pingone_userinfo',
					apiCall: { method: 'GET', path: `https://auth.pingone.com/${creds.environmentId}/as/userinfo` },
					howItWorks:
						'Uses the user access token from the auth (authorize) call to call the OIDC UserInfo (end-user info) endpoint. Returns OIDC standard claims (sub, name, email, etc.).',
					data: result.data,
				};
				setMessages((prev) => [
					...prev,
					{
						id: crypto.randomUUID(),
						type: 'assistant',
						content: mcpResult.answer,
						mcpResult,
						timestamp: new Date(),
					},
				]);
				setShowUserInfoLogin(false);
				setUserinfoUsername('');
				setUserinfoPassword('');
			} else {
				setUserinfoLoginError(result.error_description ?? 'Login or userinfo call failed.');
			}
		} catch (err) {
			setUserinfoLoginError(err instanceof Error ? err.message : 'Login failed.');
		} finally {
			setUserinfoLoginLoading(false);
		}
	}, [userinfoUsername, userinfoPassword]);

	/** Submit User login to get a user access token (for "Introspect user token"). */
	const handleUserTokenLoginSubmit = useCallback(async () => {
		const username = userTokenUsername.trim();
		const password = userTokenPassword;
		if (!username || !password) {
			setUserTokenLoginError('Please enter username and password.');
			return;
		}
		const tokenData = unifiedWorkerTokenService.getTokenDataSync();
		const creds = tokenData?.credentials;
		if (!creds?.environmentId || !creds?.clientId || !creds?.clientSecret) {
			setUserTokenLoginError('Save worker token credentials first (Configuration → MCP Server Config).');
			return;
		}
		setUserTokenLoginError(null);
		setUserTokenLoginLoading(true);
		try {
			const result = await callUserTokenViaLogin({
				environmentId: creds.environmentId,
				clientId: creds.clientId,
				clientSecret: creds.clientSecret,
				username,
				password,
				region: (creds.region as string) || 'us',
			});
			if (result.success && result.access_token) {
				handleUserTokenSet(
					result.access_token,
					result.expires_in ?? 3600,
					useAdminLogin ? creds.environmentId : undefined,
					result.id_token,
				);
				const idNote = result.id_token ? ' ID token also stored — say **"Show id token"** to inspect it.' : '';
				setMessages((prev) => [
					...prev,
					{
						id: crypto.randomUUID(),
						type: 'assistant',
						content: `✅ **Logged in as user** (${username}). Say **"Introspect user token"** to inspect the access token, or **"Show my token"** to view it.${idNote}`,
						timestamp: new Date(),
					},
				]);
				setShowUserTokenLogin(false);
				setUserTokenUsername('');
				setUserTokenPassword('');
			} else {
				setUserTokenLoginError(result.error_description ?? 'Login failed.');
			}
		} catch (err) {
			setUserTokenLoginError(err instanceof Error ? err.message : 'Login failed.');
		} finally {
			setUserTokenLoginLoading(false);
		}
	}, [userTokenUsername, userTokenPassword, handleUserTokenSet, useAdminLogin]);

	const promptCategories = [
		{
			label: '🔑 Auth',
			prompts: ['Get worker token', 'Admin login', 'List MCP tools'],
		},
		{
			label: '📱 Applications',
			prompts: [
				'Show all apps',
				'Find app named MyApp',
				'Create application named MyApp',
				'Delete application named MyApp',
				'Get app secret for <app-uuid>',
				'Rotate secret for <app-uuid>',
			],
		},
		{
			label: '👤 Users',
			prompts: [
				'List all users',
				'Find user john@acme.com',
				'Create user john@acme.com',
				'Delete user john@acme.com',
			],
		},
		{
			label: '👥 Groups',
			prompts: [
				'List groups',
				'Find group named Admins',
				'Create group named DevTeam',
				'Delete group named DevTeam',
				'What groups is user <user-uuid> in?',
				'Add user <user-uuid> to group <group-uuid>',
				'Remove user <user-uuid> from group <group-uuid>',
			],
		},
		{
			label: '🏘️ Populations',
			prompts: ['List populations'],
		},
		{
			label: '🔐 MFA',
			prompts: ['List MFA policies', 'List MFA devices for user <user-uuid>'],
		},
		{
			label: '📡 Webhooks',
			prompts: ['List subscriptions', 'Delete subscription <sub-uuid>'],
		},
		{
			label: 'ℹ️ Info',
			prompts: [
				'Show org licenses',
				'Get OIDC discovery document',
				'Introspect token',
				'Introspect user token',
				'Get userinfo',
			],
		},
		{
			label: '🔍 Token Inspector',
			prompts: [
				'Show my token',
				'Show id token',
				'Show worker token',
				'Decode token <paste-jwt-here>',
				'Show api calls',
				'Clear tokens',
			],
		},
		{
			label: '🤖 Agent & MCP',
			prompts: [
				'What is an agent?',
				'What is MCP?',
				'Explain MCP host, client, server',
				'How does this agent work?',
				'Show agent architecture',
				'What is a tool call?',
				'What is JSON-RPC?',
				'How does Groq fit in?',
			],
		},
		{
			label: '❓ Help',
			prompts: [
				'What can I do in chat?',
				'What is PKCE?',
				"What's the difference between OAuth and OIDC?",
			],
		},
	];

	const quickQuestions = [
		'List MCP tools',
		'Get worker token',
		'Show all apps',
		'List all users',
		'List groups',
		'List populations',
		'List MFA policies',
		'List subscriptions',
		'Show org licenses',
		'Get OIDC discovery document',
		'What is MCP?',
		'How does this agent work?',
		'What can I do in chat?',
		'What is PKCE?',
		"What's the difference between OAuth and OIDC?",
	];

	return (
		<>
			{/* Floating Button — hidden in fullPage mode */}
			{!isOpen && !fullPage && (
				<FloatingButton onClick={() => setIsOpen(true)} aria-label="Open AI Assistant">
					<span style={{ fontSize: '24px' }}>💬</span>
					<Pulse />
				</FloatingButton>
			)}

			{/* Chat Window */}
			{isOpen && (
				<>
					{!fullPage && isExpanded && <ExpandOverlay onClick={() => setIsExpanded(false)} />}

					{/* Prompts Guide Popout — floats beside the chat panel */}
					{showPromptsGuide && (
						<PromptsGuidePanel $expanded={!fullPage && isExpanded} $fullPage={fullPage}>
							<PromptsGuideHeader>
								<PromptsGuideTitle>📋 Prompt Reference</PromptsGuideTitle>
								<PromptsGuideClose
									type="button"
									onClick={() => setShowPromptsGuide(false)}
									aria-label="Close prompt guide"
								>
									✕
								</PromptsGuideClose>
							</PromptsGuideHeader>
							<PromptsGuideSubtitle>
								Click any prompt to use it. Start with <strong>&quot;Get worker token&quot;</strong>{' '}
								for live data.
							</PromptsGuideSubtitle>
							<PromptsGuideScroll>
								{promptCategories.map((cat) => (
									<PromptsCategory key={cat.label}>
										<PromptsCategoryLabel>{cat.label}</PromptsCategoryLabel>
										<PromptsList>
											{cat.prompts.map((p) => (
												<PromptsChipWrapper key={p}>
													<PromptsChipText
														type="button"
														onClick={() => {
															setShowPromptsGuide(false);
															handlePromptClick(p);
														}}
													>
														{p}
													</PromptsChipText>
													<PromptsCopyBtn
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															navigator.clipboard.writeText(p).then(() => {
																setCopiedPrompt(p);
																setTimeout(() => setCopiedPrompt(null), 1500);
															});
														}}
														title="Copy prompt"
														$copied={copiedPrompt === p}
													>
														{copiedPrompt === p ? '✓' : '⎘'}
													</PromptsCopyBtn>
												</PromptsChipWrapper>
											))}
										</PromptsList>
									</PromptsCategory>
								))}
							</PromptsGuideScroll>
						</PromptsGuidePanel>
					)}

					{/* Get userinfo — Sign in (Authorization Code flow, response_mode=pi.flow) */}
					{showUserInfoLogin && (
						<UserInfoLoginPanel $expanded={!fullPage && isExpanded} $fullPage={fullPage}>
							<UserInfoLoginHeader>
								<UserInfoLoginTitle>👤 Get userinfo — Sign in</UserInfoLoginTitle>
								<UserInfoLoginClose
									type="button"
									onClick={() => {
										setShowUserInfoLogin(false);
										setUserinfoLoginError(null);
										setUserinfoUsername('');
										setUserinfoPassword('');
									}}
									aria-label="Close login panel"
								>
									✕
								</UserInfoLoginClose>
							</UserInfoLoginHeader>
							<UserInfoLoginSubtitle>
								Sign in via Authorization Code flow (response_mode=pi.flow). We use the <strong>user access token</strong> returned from the auth call to call the end-user UserInfo endpoint and show your claims here.
							</UserInfoLoginSubtitle>
							<UserInfoLoginForm
								onSubmit={(e) => {
									e.preventDefault();
									handleUserInfoLoginSubmit();
								}}
							>
								<div style={{ marginBottom: 12 }}>
									<label htmlFor="userinfo-username" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#333' }}>
										Username
									</label>
									<input
										id="userinfo-username"
										type="text"
										autoComplete="username"
										value={userinfoUsername}
										onChange={(e) => setUserinfoUsername(e.target.value)}
										disabled={userinfoLoginLoading}
										style={{
											width: '100%',
											padding: '8px 10px',
											border: '1px solid #ccc',
											borderRadius: 8,
											fontSize: 14,
											boxSizing: 'border-box',
										}}
										placeholder="PingOne username"
									/>
								</div>
								<div style={{ marginBottom: 16 }}>
									<label htmlFor="userinfo-password" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#333' }}>
										Password
									</label>
									<input
										id="userinfo-password"
										type="password"
										autoComplete="current-password"
										value={userinfoPassword}
										onChange={(e) => setUserinfoPassword(e.target.value)}
										disabled={userinfoLoginLoading}
										style={{
											width: '100%',
											padding: '8px 10px',
											border: '1px solid #ccc',
											borderRadius: 8,
											fontSize: 14,
											boxSizing: 'border-box',
										}}
										placeholder="Password"
									/>
								</div>
								{userinfoLoginError && (
									<div style={{ marginBottom: 12, padding: 8, background: '#fee', color: '#c00', borderRadius: 8, fontSize: 13 }}>
										{userinfoLoginError}
									</div>
								)}
								<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
									<button
										type="button"
										onClick={() => {
											setShowUserInfoLogin(false);
											setUserinfoLoginError(null);
											setUserinfoUsername('');
											setUserinfoPassword('');
										}}
										disabled={userinfoLoginLoading}
										style={{
											padding: '8px 14px',
											borderRadius: 8,
											border: '1px solid #ccc',
											background: '#fff',
											fontSize: 14,
											cursor: userinfoLoginLoading ? 'not-allowed' : 'pointer',
										}}
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={userinfoLoginLoading}
										style={{
											padding: '8px 14px',
											borderRadius: 8,
											border: 'none',
											background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
											color: '#fff',
											fontSize: 14,
											fontWeight: 600,
											cursor: userinfoLoginLoading ? 'not-allowed' : 'pointer',
										}}
									>
										{userinfoLoginLoading ? 'Signing in…' : 'Submit'}
									</button>
								</div>
							</UserInfoLoginForm>
						</UserInfoLoginPanel>
					)}

					{/* User Token login — sign in to get a user access token for "Introspect user token" */}
					{showUserTokenLogin && (
						<UserInfoLoginPanel $expanded={!fullPage && isExpanded} $fullPage={fullPage}>
							<UserInfoLoginHeader>
								<UserInfoLoginTitle>👤 User login — get access token</UserInfoLoginTitle>
								<UserInfoLoginClose
									type="button"
									onClick={() => {
										setShowUserTokenLogin(false);
										setUserTokenLoginError(null);
										setUserTokenUsername('');
										setUserTokenPassword('');
										setUseAdminLogin(false);
									}}
									aria-label="Close user token login panel"
								>
									✕
								</UserInfoLoginClose>
							</UserInfoLoginHeader>
							<UserInfoLoginSubtitle>
								Sign in via Authorization Code flow (response_mode=pi.flow). The <strong>user access token</strong> is stored so you can say <strong>"Introspect user token"</strong> to inspect it.
								{userAccessToken && (
									<div style={{ marginTop: 8, padding: '6px 10px', background: '#e8f5e9', color: '#2e7d32', borderRadius: 8, fontSize: 12 }}>
										✅ User token active — say "Introspect user token"
										<button
											type="button"
											onClick={handleUserTokenClear}
											style={{ marginLeft: 8, cursor: 'pointer', color: '#c62828', background: 'none', border: 'none', fontSize: 12 }}
										>
											Clear
										</button>
									</div>
								)}
							</UserInfoLoginSubtitle>
							<UserInfoLoginForm
								onSubmit={(e) => {
									e.preventDefault();
									handleUserTokenLoginSubmit();
								}}
							>
								<div style={{ marginBottom: 12 }}>
									<label htmlFor="usertoken-username" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#333' }}>
										Username
									</label>
									<input
										id="usertoken-username"
										type="text"
										autoComplete="username"
										value={userTokenUsername}
										onChange={(e) => setUserTokenUsername(e.target.value)}
										disabled={userTokenLoginLoading}
										style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
										placeholder="PingOne username"
									/>
								</div>
								<div style={{ marginBottom: 16 }}>
									<label htmlFor="usertoken-password" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#333' }}>
										Password
									</label>
									<input
										id="usertoken-password"
										type="password"
										autoComplete="current-password"
										value={userTokenPassword}
										onChange={(e) => setUserTokenPassword(e.target.value)}
										disabled={userTokenLoginLoading}
										style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
										placeholder="Password"
									/>
								</div>
								{userTokenLoginError && (
									<div style={{ marginBottom: 12, padding: 8, background: '#fee', color: '#c00', borderRadius: 8, fontSize: 13 }}>
										{userTokenLoginError}
									</div>
								)}
								<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
									<button
										type="button"
										onClick={() => {
											setShowUserTokenLogin(false);
											setUserTokenLoginError(null);
											setUserTokenUsername('');
											setUserTokenPassword('');
											setUseAdminLogin(false);
										}}
										disabled={userTokenLoginLoading}
										style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', fontSize: 14, cursor: userTokenLoginLoading ? 'not-allowed' : 'pointer' }}
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={userTokenLoginLoading}
										style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: userTokenLoginLoading ? 'not-allowed' : 'pointer' }}
									>
										{userTokenLoginLoading ? 'Signing in…' : 'Sign in'}
									</button>
								</div>
							</UserInfoLoginForm>
						</UserInfoLoginPanel>
					)}

					<ChatWindow
						$expanded={!fullPage && isExpanded}
						$collapsed={!fullPage && isCollapsed}
						$fullPage={fullPage}
					>
						<ChatHeader>
							<HeaderContent>
								<AssistantIcon>🤖</AssistantIcon>
								<HeaderText>
									<HeaderTitle>MasterFlow Agent</HeaderTitle>
									<StatusRow>
										<StatusDot
											$state={groqAvailable === null ? 'checking' : groqAvailable ? 'ok' : 'off'}
											title={
												groqAvailable
													? 'Groq LLM connected (Llama 3.3 70B)'
													: groqAvailable === false
														? 'Groq not configured — click to add key'
														: 'Checking Groq…'
											}
											onClick={
												groqAvailable === false
													? () => {
															navigate('/configuration');
															setIsOpen(false);
														}
													: undefined
											}
											style={{ cursor: groqAvailable === false ? 'pointer' : 'default' }}
										>
											⚡ Groq
										</StatusDot>
										<StatusDot
											$state={braveAvailable === null ? 'checking' : braveAvailable ? 'ok' : 'off'}
											title={
												braveAvailable
													? 'Brave Search connected'
													: braveAvailable === false
														? 'Brave Search not configured — click to add key'
														: 'Checking Brave…'
											}
											onClick={
												braveAvailable === false
													? () => {
															navigate('/configuration');
															setIsOpen(false);
														}
													: undefined
											}
											style={{ cursor: braveAvailable === false ? 'pointer' : 'default' }}
										>
											🌐 Brave
										</StatusDot>
										<StatusDot
											$state={
												_workerTokenStatus === null
													? 'checking'
													: includeLive &&
														  _workerTokenStatus.hasCredentials &&
														  _workerTokenStatus.tokenValid
														? 'ok'
														: 'off'
											}
											title={
												_workerTokenStatus === null
													? 'Checking MCP…'
													: includeLive &&
														  _workerTokenStatus.hasCredentials &&
														  _workerTokenStatus.tokenValid
														? 'MCP connected — Live PingOne data ready'
														: !includeLive
															? 'MCP disabled — turn on Live toggle'
															: !_workerTokenStatus.hasCredentials
																? 'MCP not configured — save worker credentials in Configuration'
																: 'MCP needs refresh — click 🔑 to get worker token'
											}
											onClick={
												(!includeLive || !_workerTokenStatus?.hasCredentials) &&
												_workerTokenStatus !== null
													? () => {
															navigate('/configuration');
															setIsOpen(false);
														}
													: undefined
											}
											style={{
												cursor:
													(!includeLive || !_workerTokenStatus?.hasCredentials) &&
													_workerTokenStatus !== null
														? 'pointer'
														: 'default',
											}}
										>
											🔌 MCP
										</StatusDot>
									</StatusRow>
								</HeaderText>
							</HeaderContent>
							<HeaderActions>
								<ToggleContainer title="Include PingOne API reference docs in context">
									<ToggleLabel>
										<ToggleCheckbox
											type="checkbox"
											title="Include PingOne API reference docs in context"
											checked={includeApiDocs}
											onChange={(e) => setIncludeApiDocs(e.target.checked)}
											aria-label="Include PingOne API docs"
										/>
										<ToggleText>APIs</ToggleText>
									</ToggleLabel>
								</ToggleContainer>
								<ToggleContainer title="Include OAuth 2.0 and OIDC specifications in context">
									<ToggleLabel>
										<ToggleCheckbox
											type="checkbox"
											title="Include OAuth 2.0 and OIDC specifications in context"
											checked={includeSpecs}
											onChange={(e) => setIncludeSpecs(e.target.checked)}
											aria-label="Include OAuth/OIDC specifications"
										/>
										<ToggleText>Specs</ToggleText>
									</ToggleLabel>
								</ToggleContainer>
								<ToggleContainer title="Include PingOne workflow guides in context">
									<ToggleLabel>
										<ToggleCheckbox
											type="checkbox"
											title="Include PingOne workflow guides in context"
											checked={includeWorkflows}
											onChange={(e) => setIncludeWorkflows(e.target.checked)}
											aria-label="Include PingOne workflows"
										/>
										<ToggleText>Workflows</ToggleText>
									</ToggleLabel>
								</ToggleContainer>
								<ToggleContainer title="Include the OAuth Playground user guide in context">
									<ToggleLabel>
										<ToggleCheckbox
											type="checkbox"
											title="Include the OAuth Playground user guide in context"
											checked={includeUserGuide}
											onChange={(e) => setIncludeUserGuide(e.target.checked)}
											aria-label="Include User Guide"
										/>
										<ToggleText>Guide</ToggleText>
									</ToggleLabel>
								</ToggleContainer>
								<ToggleContainer title="Include live web results via Brave Search. Requires BRAVE_API_KEY on the server (see .env).">
									<ToggleLabel>
										<ToggleCheckbox
											type="checkbox"
											title="Include live web results via Brave Search. Requires BRAVE_API_KEY on the server."
											checked={includeWeb}
											onChange={(e) => setIncludeWeb(e.target.checked)}
											aria-label="Include web search results (Brave Search; needs BRAVE_API_KEY on server)"
										/>
										<ToggleText>Web</ToggleText>
										<ToggleHint>(Brave)</ToggleHint>
									</ToggleLabel>
								</ToggleContainer>
								<ToggleContainer title="Call PingOne live via MCP tools. Requires PINGONE_ENVIRONMENT_ID + PINGONE_WORKER_TOKEN on the server.">
									<ToggleLabel>
										<ToggleCheckbox
											type="checkbox"
											title="Call PingOne live via MCP tools. Requires credentials on server."
											checked={includeLive}
											onChange={(e) => setIncludeLive(e.target.checked)}
											aria-label="Call PingOne live via MCP tools (requires credentials on server)"
										/>
										<ToggleLiveText $active={includeLive}>Live</ToggleLiveText>
										<ToggleHint>(MCP)</ToggleHint>
									</ToggleLabel>
								</ToggleContainer>
								<RefreshTokenButton
									type="button"
									onClick={handleOpenRefreshTokenConfirm}
									aria-label="Refresh worker token (requires confirmation)"
									title="Get a new worker token using saved credentials (you will be asked to confirm)"
								>
									🔑
								</RefreshTokenButton>
								{/* New chat — always visible */}
								<HeaderIconButton
									type="button"
									onClick={handleNewChat}
									aria-label="New conversation"
									title="Start a new conversation (clears history)"
								>
									<span style={{ fontSize: '14px' }}>🗑️</span>
								</HeaderIconButton>
								{/* Export conversation — always visible */}
								<HeaderIconButton
									type="button"
									onClick={handleExportConversation}
									aria-label="Export conversation as Markdown"
									title="Export conversation as Markdown"
								>
									<span style={{ fontSize: '14px' }}>📤</span>
								</HeaderIconButton>
								{/* Popout — only in embedded (non-fullPage) mode */}
								{!fullPage && (
									<>
										<CollapseButton
											type="button"
											onClick={() => {
												setIsCollapsed((v) => !v);
												setIsExpanded(false);
											}}
											aria-label={isCollapsed ? 'Restore assistant' : 'Minimise assistant'}
											title={isCollapsed ? 'Restore' : 'Minimise'}
										>
											<span style={{ fontSize: '16px' }}>{isCollapsed ? '▲' : '▼'}</span>
										</CollapseButton>
										<ExpandButton
											type="button"
											onClick={() => setIsExpanded((v) => !v)}
											aria-label={isExpanded ? 'Collapse to compact view' : 'Expand to full view'}
											title={isExpanded ? 'Collapse' : 'Expand to full screen'}
										>
											<span style={{ fontSize: '16px' }}>{isExpanded ? '⊡' : '⛶'}</span>
										</ExpandButton>
										<CloseButton
											onClick={() => {
												setIsOpen(false);
												setIsExpanded(false);
												setIsCollapsed(false);
											}}
											aria-label="Close assistant"
											title="Close assistant (Esc)"
										>
											<span style={{ fontSize: '20px' }}>❌</span>
										</CloseButton>
									</>
								)}
							</HeaderActions>
						</ChatHeader>

						{!isCollapsed && (
							<>
								<MessagesContainer ref={messagesContainerRef}>
									{messages.map((message) => (
										<MessageWrapper key={message.id} $isUser={message.type === 'user'}>
											<MessageBubble $isUser={message.type === 'user'}>
												<MessageContent>
													{renderMessageText(
														message.content.replace('##LIVE_NUDGE##', '').trimEnd()
													)}
												</MessageContent>
												{/* Streaming cursor */}
												{message.streaming && <StreamingCursor />}
												{/* Copy / Save as .md — assistant messages only, shown on hover */}
												{message.type === 'assistant' && !message.streaming && (
													<MessageActionRow>
														<MessageCopyBtn
															type="button"
															$copied={copiedMessage === message.id}
															onClick={() => handleCopyMessage(message.id, message.content)}
															title="Copy message"
															aria-label="Copy message to clipboard"
														>
															{copiedMessage === message.id ? '✓ Copied' : '⎘ Copy'}
														</MessageCopyBtn>
														<MessageCopyBtn
															type="button"
															$copied={savedMessage === message.id}
															onClick={() => handleSaveAsMarkdown(message.id, message.content)}
															title="Save as .md file to disk"
															aria-label="Save as markdown file"
														>
															{savedMessage === message.id ? '✓ Saved' : '📄 Save .md'}
														</MessageCopyBtn>
													</MessageActionRow>
												)}
												{/* Live-toggle nudge button — when Groq detected a PingOne command */}
												{message.type === 'assistant' &&
													!message.streaming &&
													message.content.includes('##LIVE_NUDGE##') &&
													!includeLive && (
														<LiveNudgeButton type="button" onClick={() => setIncludeLive(true)}>
															⚡ Enable Live now →
														</LiveNudgeButton>
													)}
												{/* Groq badge — shown when the LLM answered */}
												{message.groqUsed && (
													<GroqBadgeRow>
														<GroqBadge>⚡ Groq · Llama 3.3 70B</GroqBadge>
													</GroqBadgeRow>
												)}
												{/* MCP Live result card */}
												{message.mcpResult && (
													<McpResultCard $isSuccess={!!message.mcpResult.success}>
														<McpResultHeader>
															<McpBadge>🔌 MCP</McpBadge>
															<McpToolName>
																{message.mcpResult.mcpTool ?? 'PingOne MCP'}
															</McpToolName>
															{!!message.mcpResult.success && (
																<McpSuccessBadge>
																	{message.mcpResult.mcpTool === 'pingone_get_worker_token'
																		? '✓ Token ready'
																		: '✓ Success'}
																</McpSuccessBadge>
															)}
														</McpResultHeader>
														{message.mcpResult.apiCall && (
															<McpApiRow>
																<McpApiMethod>{message.mcpResult.apiCall.method}</McpApiMethod>
																<McpApiPath>{message.mcpResult.apiCall.path}</McpApiPath>
															</McpApiRow>
														)}
														{message.mcpResult.howItWorks && (
															<McpExplanation>{message.mcpResult.howItWorks}</McpExplanation>
														)}
														{message.mcpResult.credentialsRequired && (
															<McpCredentialHint>
																� Type <strong>&quot;Get worker token&quot;</strong> to
																authenticate, then ask again for live PingOne data.
															</McpCredentialHint>
														)}
														{message.mcpResult.data != null &&
															((Array.isArray(message.mcpResult.data) &&
																(message.mcpResult.data as unknown[]).length > 0) ||
																(typeof message.mcpResult.data === 'object' &&
																	Object.keys(message.mcpResult.data as object).length > 0)) && (
																<McpDataSection>
																	<McpDataLabel>
																		{Array.isArray(message.mcpResult.data)
																			? `Data (${(message.mcpResult.data as unknown[]).length} items)`
																			: 'Data'}
																		<McpJsonToggle
																			onClick={() =>
																				setMessages((prev) =>
																					prev.map((m) =>
																						m.id === message.id && m.mcpResult
																							? {
																									...m,
																									mcpResult: {
																										...m.mcpResult,
																										rawJson: !m.mcpResult.rawJson,
																									},
																								}
																							: m
																					)
																				)
																			}
																		>
																			{message.mcpResult.rawJson ? '📋 Formatted' : '{ } JSON'}
																		</McpJsonToggle>
																	</McpDataLabel>
																	{message.mcpResult.rawJson || !Array.isArray(message.mcpResult.data) ? (
																		<McpDataPre>
																			{JSON.stringify(message.mcpResult.data, null, 2)}
																		</McpDataPre>
																	) : (
																		<McpDataPagedDisplay data={message.mcpResult.data as unknown[]} />
																	)}
																</McpDataSection>
															)}
													</McpResultCard>
												)}
												{/* Brave web search result card */}
												{message.webResult && (
													<BraveResultCard>
														<BraveResultHeader>
															<BraveBadge>🌐 Brave</BraveBadge>
															<BraveToolName>brave_web_search</BraveToolName>
														</BraveResultHeader>
														{message.webResult.credentialsRequired && (
															<McpCredentialHint>
																💡 Add your Brave Search API key in the Configuration page to enable
																web search.
															</McpCredentialHint>
														)}
														{message.webResult.data != null &&
															Array.isArray(message.webResult.data) &&
															(message.webResult.data as BraveResult[]).length > 0 && (
																<BraveResultsList>
																	{(message.webResult.data as BraveResult[]).map((r, i) => (
																		<BraveResultItem
																			key={i}
																			onClick={() =>
																				window.open(r.url, '_blank', 'noopener,noreferrer')
																			}
																		>
																			<BraveResultTitle>{r.title}</BraveResultTitle>
																			<BraveResultUrl>{r.url}</BraveResultUrl>
																			{r.content && (
																				<BraveResultSnippet>{r.content}</BraveResultSnippet>
																			)}
																		</BraveResultItem>
																	))}
																</BraveResultsList>
															)}
													</BraveResultCard>
												)}
												{message.links && message.links.length > 0 && (
													<LinksContainer>
														<LinksTitle>Related Resources:</LinksTitle>
														{message.links.map((link, idx) => (
															<LinkItem
																key={idx}
																onClick={() => handleLinkClick(link.path, link.external)}
															>
																<LinkIcon $type={link.type}>
																	{link.type === 'flow' && '🔄'}
																	{link.type === 'feature' && '⚡'}
																	{link.type === 'doc' && '📖'}
																	{link.type === 'api' && '🔌'}
																	{link.type === 'spec' && '📋'}
																	{link.type === 'workflow' && '🔀'}
																	{link.type === 'guide' && '📚'}
																	{link.type === 'web' && '🌐'}
																</LinkIcon>
																<LinkText>{link.title}</LinkText>
																<span style={{ fontSize: '14px' }}>🔗</span>
															</LinkItem>
														))}
													</LinksContainer>
												)}
											</MessageBubble>
										</MessageWrapper>
									))}

									{isTyping && (
										<MessageWrapper $isUser={false}>
											<MessageBubble $isUser={false}>
												<TypingIndicator>
													<Dot $delay={0} />
													<Dot $delay={0.2} />
													<Dot $delay={0.4} />
												</TypingIndicator>
											</MessageBubble>
										</MessageWrapper>
									)}

									{messages.length === 1 && (
										<QuickQuestionsContainer>
											<QuickQuestionsTitle>Quick questions:</QuickQuestionsTitle>
											{quickQuestions.map((question, idx) => (
												<QuickQuestionButton
													key={idx}
													onClick={() => handlePromptClick(question)}
												>
													{question}
												</QuickQuestionButton>
											))}
										</QuickQuestionsContainer>
									)}

									<div ref={messagesEndRef} />
								</MessagesContainer>

								<InputContainer>
									<PromptsToggleButton
										type="button"
										$active={showPromptsGuide}
										onClick={() => setShowPromptsGuide((v) => !v)}
										aria-label="Show prompt guide"
										title="Browse all available prompts"
									>
										📋
									</PromptsToggleButton>
									<Input
										value={input}
										onChange={(e) => setInput(e.target.value)}
										onKeyPress={handleKeyPress}
										placeholder="Get worker token"
										aria-label="Message input"
									/>
									<SendButton
										onClick={() => handleSend()}
										disabled={!input.trim()}
										aria-label="Send message"
										title="Send message (Enter)"
									>
										<span style={{ fontSize: '20px' }}>⬆</span>
									</SendButton>
								</InputContainer>
							</>
						)}
					</ChatWindow>
				</>
			)}

			{/* Confirm dialog: get new worker token (user must confirm for security) */}
			{showRefreshTokenConfirm && (
				<ConfirmBackdrop
					role="dialog"
					aria-modal="true"
					aria-labelledby="refresh-token-title"
					onClick={(e) => {
						if (e.target === e.currentTarget) setShowRefreshTokenConfirm(false);
					}}
				>
					<ConfirmDialog onClick={(e) => e.stopPropagation()}>
						<ConfirmTitle id="refresh-token-title">Get new worker token?</ConfirmTitle>
						<ConfirmText>
							This will use your saved credentials and store the new token so the assistant and
							other features can keep working. Continue?
						</ConfirmText>
						<ConfirmActions>
							<ConfirmButton
								type="button"
								$primary={false}
								onClick={() => setShowRefreshTokenConfirm(false)}
							>
								Cancel
							</ConfirmButton>
							<ConfirmButton
								type="button"
								$primary
								onClick={handleRefreshTokenConfirm}
								disabled={isRefreshingToken}
								aria-busy={isRefreshingToken}
							>
								{isRefreshingToken ? 'Getting token…' : 'Get new token'}
							</ConfirmButton>
						</ConfirmActions>
					</ConfirmDialog>
				</ConfirmBackdrop>
			)}

			{/* Placeholder fill: ask for missing values then put updated command in prompt box */}
			{placeholderFill && (
				<ConfirmBackdrop
					role="dialog"
					aria-modal="true"
					aria-labelledby="placeholder-fill-title"
					onClick={(e) => {
						if (e.target === e.currentTarget) {
							setPlaceholderFill(null);
							setPlaceholderValues({});
						}
					}}
				>
					<ConfirmDialog onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
						<ConfirmTitle id="placeholder-fill-title">This command needs more info</ConfirmTitle>
						<ConfirmText style={{ marginBottom: 16 }}>
							Enter the values below. The command will be filled in the prompt box; you can edit and send.
						</ConfirmText>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
							{placeholderFill.placeholders.map((key) => (
								<div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
									<label htmlFor={`placeholder-${key}`} style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>
										{PLACEHOLDER_LABELS[key] ?? key}
									</label>
									<input
										id={`placeholder-${key}`}
										type="text"
										value={placeholderValues[key] ?? ''}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setPlaceholderValues((prev) => ({ ...prev, [key]: e.target.value }))
										}
										placeholder={`e.g. ${key}`}
										aria-label={PLACEHOLDER_LABELS[key] ?? key}
										style={{
											padding: '8px 12px',
											border: '1px solid #ddd',
											borderRadius: 8,
											fontSize: 14,
										}}
									/>
								</div>
							))}
						</div>
						<ConfirmActions>
							<ConfirmButton
								type="button"
								$primary={false}
								onClick={() => {
									setPlaceholderFill(null);
									setPlaceholderValues({});
								}}
							>
								Cancel
							</ConfirmButton>
							<ConfirmButton type="button" $primary={false} onClick={() => handlePlaceholderFillSubmit(false)}>
								Fill in prompt
							</ConfirmButton>
							<ConfirmButton type="button" $primary onClick={() => handlePlaceholderFillSubmit(true)}>
								Fill & send
							</ConfirmButton>
						</ConfirmActions>
					</ConfirmDialog>
				</ConfirmBackdrop>
			)}
		</>
	);
};

// Styled Components
const FloatingButton = styled.button`
	position: fixed;
	bottom: 24px;
	right: 90px; /* Move left to make room for debug logger button */
	width: 60px;
	height: 60px;
	border-radius: 50%;
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	color: white;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	transition: all 0.3s ease;
	z-index: 1001; /* Higher than debug logger (9998) */

	&:hover {
		transform: scale(1.1);
		box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6);
	}

	&:active {
		transform: scale(0.95);
	}
`;

const Pulse = styled.div`
	position: absolute;
	width: 100%;
	height: 100%;
	border-radius: 50%;
	background: rgba(239, 68, 68, 0.4);
	animation: pulse 2s infinite;

	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(1.5);
			opacity: 0;
		}
	}
`;

const ExpandOverlay = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.55);
	z-index: 1000;
	backdrop-filter: blur(2px);
`;

const ChatWindow = styled.div<{ $expanded?: boolean; $collapsed?: boolean; $fullPage?: boolean }>`
	${({ $fullPage }) =>
		$fullPage &&
		`
    position: relative;
    bottom: auto;
    right: auto;
    top: auto;
    left: auto;
    transform: none;
    width: 100%;
    height: 100%;
    border-radius: 0;
    box-shadow: none;
  `}
	${({ $fullPage }) => !$fullPage && `position: fixed;`}
  ${({ $expanded, $collapsed }) =>
		$collapsed
			? `
    bottom: 24px;
    right: 90px;
    width: 520px;
    height: auto;
    `
			: $expanded
				? `
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(1100px, 92vw);
    height: min(88vh, 900px);
    bottom: auto;
    right: auto;
    `
				: `
    bottom: 24px;
    right: 90px;
    width: 520px;
    height: 680px;
    `}
  background: white;
	border-radius: 16px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
	display: flex;
	flex-direction: column;
	z-index: 1001;
	overflow: hidden;
	isolation: isolate;
	transition:
		width 0.25s ease,
		height 0.25s ease;

	@media (max-width: 768px) {
		width: calc(100vw - 32px);
		height: ${({ $collapsed }) => ($collapsed ? 'auto' : 'calc(100vh - 100px)')};
		bottom: 16px;
		right: 16px;
		top: auto;
		left: auto;
		transform: none;
	}
`;

const ChatHeader = styled.div`
	background: #dc2626;
	color: white;
	padding: 6px 10px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 6px;
	flex-wrap: wrap;
	min-height: 0;
`;

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
`;

const AssistantIcon = styled.div`
	font-size: 18px;
	flex-shrink: 0;
`;

const HeaderText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`;

const HeaderTitle = styled.div`
	font-weight: 600;
	font-size: 13px;
	white-space: nowrap;
`;

const StatusRow = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
`;

const StatusDot = styled.span<{ $state: 'ok' | 'off' | 'checking' }>`
	display: inline-flex;
	align-items: center;
	gap: 2px;
	font-size: 9px;
	font-weight: 600;
	padding: 1px 5px;
	border-radius: 12px;
	letter-spacing: 0.03em;
	white-space: nowrap;
	transition: opacity 0.3s;

	${({ $state }) =>
		$state === 'ok'
			? `background: rgba(255,255,255,0.25); color: #fff; opacity: 1;`
			: $state === 'off'
				? `background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.55); opacity: 1;`
				: `background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.45); opacity: 0.7;`}

	&::before {
		content: '';
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
		background: ${({ $state }) =>
			$state === 'ok' ? '#4ade80' : $state === 'off' ? '#f87171' : '#facc15'};
		${({ $state }) => $state === 'ok' && `box-shadow: 0 0 4px #4ade80;`}
	}
`;

const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: flex-end;
	flex: 1;
	min-width: 0;
`;

const ToggleContainer = styled.div`
	display: flex;
	align-items: center;
`;

const ToggleLabel = styled.label`
	display: flex;
	align-items: center;
	gap: 6px;
	cursor: pointer;
	user-select: none;
`;

const ToggleCheckbox = styled.input`
	width: 16px;
	height: 16px;
	cursor: pointer;
	accent-color: white;
`;

const ToggleText = styled.span`
	font-size: 12px;
	font-weight: 500;
	white-space: nowrap;
`;

const ToggleHint = styled.span`
	font-size: 10px;
	opacity: 0.85;
	white-space: nowrap;
`;

const RefreshTokenButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	font-size: 16px;
	transition: background 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.35);
	}
`;

const HeaderIconButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	font-size: 14px;
	transition: background 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.35);
	}
`;

const CollapseButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: background 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.3);
	}
`;

const ExpandButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: background 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.3);
	}
`;

const CloseButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: background 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.3);
	}
`;

const MessagesContainer = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
	background: #f8f9fa;
`;

const MessageWrapper = styled.div<{ $isUser: boolean }>`
	display: flex;
	justify-content: ${(props) => (props.$isUser ? 'flex-end' : 'flex-start')};
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
	max-width: 80%;
	padding: 12px 16px;
	border-radius: 16px;
	background: ${(props) =>
		props.$isUser ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
	color: ${(props) => (props.$isUser ? 'white' : '#333')};
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	word-wrap: break-word;
`;

const MessageContent = styled.div`
	line-height: 1.6;
	font-size: 15px;
`;

const MessageActionRow = styled.div`
	display: none;
	margin-top: 8px;
	gap: 8px;
	flex-wrap: wrap;
	align-items: center;

	${MessageBubble}:hover & {
		display: flex;
	}
`;

const MessageCopyBtn = styled.button<{ $copied?: boolean }>`
	display: none;
	margin-top: 8px;
	padding: 3px 10px;
	border-radius: 20px;
	border: 1px solid ${(p) => (p.$copied ? '#22c55e' : 'rgba(0,0,0,0.15)')};
	background: ${(p) => (p.$copied ? '#eefff4' : 'rgba(0,0,0,0.04)')};
	color: ${(p) => (p.$copied ? '#16a34a' : '#888')};
	font-size: 11px;
	cursor: pointer;
	transition: all 0.15s;
	white-space: nowrap;
	&:hover {
		background: rgba(102, 126, 234, 0.1);
		color: #667eea;
		border-color: #667eea;
	}

	/* Show on parent bubble hover */
	${MessageBubble}:hover & {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
`;

const StreamingCursor = styled.span`
	display: inline-block;
	width: 2px;
	height: 1em;
	background: #667eea;
	margin-left: 2px;
	vertical-align: text-bottom;
	animation: blink 0.7s step-end infinite;
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
`;

const LinksContainer = styled.div`
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px solid rgba(0, 0, 0, 0.1);
`;

const LinksTitle = styled.div`
	font-size: 12px;
	font-weight: 600;
	margin-bottom: 8px;
	opacity: 0.8;
`;

const LinkItem = styled.button`
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
	padding: 8px;
	margin-bottom: 4px;
	background: rgba(0, 0, 0, 0.05);
	border: none;
	border-radius: 8px;
	cursor: pointer;
	transition: background 0.2s;
	text-align: left;

	&:hover {
		background: rgba(0, 0, 0, 0.1);
	}
`;

const LinkIcon = styled.span<{ $type: string }>`
	font-size: 16px;
`;

const LinkText = styled.span`
	flex: 1;
	font-size: 13px;
	color: inherit;
`;

const TypingIndicator = styled.div`
	display: flex;
	gap: 4px;
	padding: 4px 0;
`;

const Dot = styled.div<{ $delay: number }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #999;
	animation: bounce 1.4s infinite ease-in-out;
	animation-delay: ${(props) => props.$delay}s;

	@keyframes bounce {
		0%,
		80%,
		100% {
			transform: scale(0);
		}
		40% {
			transform: scale(1);
		}
	}
`;

const QuickQuestionsContainer = styled.div`
	margin-top: 8px;
`;

const QuickQuestionsTitle = styled.div`
	font-size: 12px;
	font-weight: 600;
	color: #666;
	margin-bottom: 8px;
`;

const QuickQuestionButton = styled.button`
	display: block;
	width: 100%;
	padding: 10px 12px;
	margin-bottom: 6px;
	background: white;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	text-align: left;
	font-size: 13px;
	color: #333;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: #f5f5f5;
		border-color: #667eea;
		transform: translateX(4px);
	}
`;

const InputContainer = styled.div`
	padding: 16px;
	background: white;
	border-top: 1px solid #e0e0e0;
	display: flex;
	gap: 8px;
`;

const Input = styled.input`
	flex: 1;
	padding: 12px;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	font-size: 14px;
	outline: none;
	transition: border-color 0.2s;

	&:focus {
		border-color: #667eea;
	}

	&::placeholder {
		color: #999;
	}
`;

const SendButton = styled.button`
	width: 44px;
	height: 44px;
	border-radius: 8px;
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	color: white;
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
	}

	&:active:not(:disabled) {
		transform: scale(0.95);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ConfirmBackdrop = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10052;
`;

const ConfirmDialog = styled.div`
	background: white;
	border-radius: 12px;
	padding: 20px;
	max-width: 360px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
`;

const ConfirmTitle = styled.h3`
	margin: 0 0 12px;
	font-size: 16px;
	font-weight: 600;
	color: #333;
`;

const ConfirmText = styled.p`
	margin: 0 0 20px;
	font-size: 14px;
	color: #666;
	line-height: 1.4;
`;

const ConfirmActions = styled.div`
	display: flex;
	gap: 10px;
	justify-content: flex-end;
`;

const ConfirmButton = styled.button<{ $primary?: boolean }>`
	padding: 8px 16px;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	border: 1px solid #ddd;
	background: ${(p) =>
		p.$primary ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
	color: ${(p) => (p.$primary ? 'white' : '#333')};

	&:hover:not(:disabled) {
		opacity: 0.95;
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

// ─── Prompts Guide Panel ─────────────────────────────────────────────────────

const PromptsGuidePanel = styled.div<{ $expanded?: boolean; $fullPage?: boolean }>`
	position: fixed;
	z-index: 1002;
	background: white;
	border-radius: 16px;
	box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
	border: 1px solid rgba(102, 126, 234, 0.2);
	display: flex;
	flex-direction: column;
	overflow: hidden;

	/* Default: sit beside the chat panel (chat is right:90px, width:520px) */
	bottom: 24px;
	right: 622px;
	width: 460px;
	height: 680px;

	/* When chat is in expanded/centered mode */
	${({ $expanded }) =>
		$expanded &&
		`
    top: 50%;
    bottom: auto;
    right: auto;
    left: max(12px, calc(50% - min(550px, 46vw) - 472px));
    transform: translateY(-50%);
    height: min(88vh, 860px);
  `}

	/* Full-page mode: left sidebar */
  ${({ $fullPage }) =>
		$fullPage &&
		`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: auto;
    width: 380px;
    height: auto;
    border-radius: 0;
    border-right: 1px solid #e0e0e0;
    border-top: none;
    border-left: none;
    border-bottom: none;
    box-shadow: 4px 0 24px rgba(0,0,0,0.08);
    z-index: 10;
  `}

  @media (max-width: 900px) {
		right: 8px;
		left: 8px;
		width: auto;
		bottom: 90px;
		height: min(65vh, 480px);
	}
`;

const PromptsGuideHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px 4px;
`;

const PromptsGuideTitle = styled.div`
	font-size: 13px;
	font-weight: 700;
	color: #333;
`;

const PromptsGuideClose = styled.button`
	background: none;
	border: none;
	font-size: 14px;
	color: #888;
	cursor: pointer;
	padding: 2px 6px;
	border-radius: 4px;
	line-height: 1;
	&:hover {
		background: #f0f0f0;
		color: #333;
	}
`;

const PromptsGuideSubtitle = styled.div`
	font-size: 11px;
	color: #888;
	padding: 0 16px 8px;
	line-height: 1.4;
`;

const PromptsGuideScroll = styled.div`
	overflow-y: auto;
	padding: 0 16px 12px;
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

// ─── UserInfo Login Panel (Get userinfo — pi.flow sign-in) ───────────────────
const UserInfoLoginPanel = styled.div<{ $expanded?: boolean; $fullPage?: boolean }>`
	position: fixed;
	z-index: 1002;
	background: white;
	border-radius: 16px;
	box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
	border: 1px solid rgba(102, 126, 234, 0.2);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	bottom: 24px;
	right: 622px;
	width: 380px;
	max-height: 420px;
	${({ $expanded }) =>
		$expanded &&
		`
    top: 50%;
    bottom: auto;
    right: auto;
    left: max(12px, calc(50% - min(550px, 46vw) - 472px));
    transform: translateY(-50%);
    max-height: min(88vh, 480px);
  `}
	${({ $fullPage }) =>
		$fullPage &&
		`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: auto;
    width: 360px;
    max-height: none;
    height: auto;
    border-radius: 0;
    border-right: 1px solid #e0e0e0;
    border-top: none;
    border-left: none;
    border-bottom: none;
    box-shadow: 4px 0 24px rgba(0,0,0,0.08);
    z-index: 10;
  `}
	@media (max-width: 900px) {
		right: 8px;
		left: 8px;
		width: auto;
		bottom: 90px;
		max-height: min(65vh, 420px);
	}
`;

const UserInfoLoginHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px 4px;
`;

const UserInfoLoginTitle = styled.div`
	font-size: 13px;
	font-weight: 700;
	color: #333;
`;

const UserInfoLoginClose = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	font-size: 18px;
	color: #666;
	padding: 4px;
	line-height: 1;
	&:hover {
		color: #333;
	}
`;

const UserInfoLoginSubtitle = styled.div`
	font-size: 12px;
	color: #666;
	padding: 0 16px 12px;
	line-height: 1.4;
`;

const UserInfoLoginForm = styled.form`
	padding: 0 16px 16px;
	overflow-y: auto;
`;

const PromptsCategory = styled.div``;

const PromptsCategoryLabel = styled.div`
	font-size: 11px;
	font-weight: 700;
	color: #667eea;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	margin-bottom: 5px;
`;

const PromptsList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 5px;
`;

const PromptsChipWrapper = styled.div`
	display: inline-flex;
	align-items: stretch;
	border-radius: 20px;
	border: 1px solid #d8d8e8;
	background: #f4f4fb;
	overflow: hidden;
	transition: all 0.15s;
	&:hover {
		border-color: #667eea;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
	}
`;

const PromptsChipText = styled.button`
	padding: 5px 10px;
	background: none;
	border: none;
	color: #444;
	font-size: 12px;
	cursor: pointer;
	white-space: nowrap;
	transition: color 0.15s;
	line-height: 1.4;
	&:hover {
		color: #667eea;
	}
`;

const PromptsCopyBtn = styled.button<{ $copied?: boolean }>`
	padding: 4px 8px;
	border: none;
	border-left: 1px solid #d8d8e8;
	background: ${(p) => (p.$copied ? '#eefff4' : 'transparent')};
	color: ${(p) => (p.$copied ? '#22c55e' : '#aaa')};
	font-size: 13px;
	cursor: pointer;
	transition: all 0.15s;
	line-height: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 26px;
	&:hover {
		background: #ededf8;
		color: #667eea;
	}
`;

const PromptsToggleButton = styled.button<{ $active: boolean }>`
	width: 40px;
	height: 44px;
	flex-shrink: 0;
	border-radius: 8px;
	border: 1px solid ${(p) => (p.$active ? '#667eea' : '#e0e0e0')};
	background: ${(p) => (p.$active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white')};
	color: ${(p) => (p.$active ? 'white' : '#555')};
	font-size: 16px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
	&:hover {
		border-color: #667eea;
		background: ${(p) =>
			p.$active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f4f4fb'};
	}
`;

// ─── MCP Live result card ────────────────────────────────────────────────────

const McpResultCard = styled.div<{ $isSuccess?: boolean }>`
	margin-top: 12px;
	padding: 10px 12px;
	background: ${({ $isSuccess }) =>
		$isSuccess ? 'rgba(34, 197, 94, 0.12)' : 'rgba(102, 126, 234, 0.07)'};
	border: 1px solid
		${({ $isSuccess }) =>
			$isSuccess ? 'rgba(34, 197, 94, 0.5)' : 'rgba(102, 126, 234, 0.25)'};
	border-radius: 10px;
	display: flex;
	flex-direction: column;
	gap: 6px;
	font-size: 12px;
	${({ $isSuccess }) =>
		$isSuccess &&
		`
		box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.15);
	`}
`;

const McpResultHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const McpBadge = styled.span`
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	font-size: 10px;
	font-weight: 700;
	padding: 2px 7px;
	border-radius: 20px;
	letter-spacing: 0.05em;
	white-space: nowrap;
`;

const McpSuccessBadge = styled.span`
	background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
	color: white;
	font-size: 10px;
	font-weight: 700;
	padding: 2px 8px;
	border-radius: 20px;
	letter-spacing: 0.05em;
	white-space: nowrap;
	box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
	margin-left: auto;
`;

const McpToolName = styled.code`
	font-size: 12px;
	font-family: 'SFMono-Regular', Consolas, monospace;
	color: #5a45bd;
	font-weight: 600;
`;

const McpApiRow = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
`;

const McpApiMethod = styled.span`
	font-family: 'SFMono-Regular', Consolas, monospace;
	font-size: 10px;
	font-weight: 700;
	background: #e8f4fd;
	color: #1a6fba;
	padding: 1px 6px;
	border-radius: 4px;
	text-transform: uppercase;
`;

const McpApiPath = styled.span`
	font-family: 'SFMono-Regular', Consolas, monospace;
	font-size: 11px;
	color: #555;
	word-break: break-all;
`;

const McpExplanation = styled.p`
	margin: 0;
	font-size: 12px;
	color: #555;
	line-height: 1.5;
`;

const McpCredentialHint = styled.div`
	margin-top: 2px;
	font-size: 11px;
	color: #a07c00;
	background: #fffbea;
	border: 1px solid #f0dc82;
	border-radius: 6px;
	padding: 6px 8px;
	line-height: 1.4;
`;

const McpDataSection = styled.div`
	margin-top: 4px;
`;

const McpDataLabel = styled.div`
	font-size: 11px;
	font-weight: 600;
	color: #666;
	margin-bottom: 4px;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const McpJsonToggle = styled.button`
	font-size: 10px;
	padding: 1px 6px;
	border: 1px solid #c5c5d0;
	border-radius: 4px;
	background: #f0f0f6;
	color: #555;
	cursor: pointer;
	line-height: 1.6;
	&:hover {
		background: #e0e0ea;
	}
`;

const McpDataPre = styled.pre`
	margin: 0;
	font-size: 10px;
	font-family: 'SFMono-Regular', Consolas, monospace;
	background: #f4f4f8;
	border-radius: 6px;
	padding: 8px;
	overflow-x: auto;
	max-height: 200px;
	overflow-y: auto;
	color: #333;
	line-height: 1.4;
	white-space: pre-wrap;
	word-break: break-word;
`;

const McpDataItemList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 5px;
	margin-top: 2px;
`;

const McpDataItem = styled.div`
	background: white;
	border: 1px solid rgba(102, 126, 234, 0.2);
	border-radius: 7px;
	padding: 6px 9px;
`;

const McpDataRow = styled.div`
	display: flex;
	gap: 8px;
	font-size: 11px;
	line-height: 1.45;
	align-items: baseline;
`;

const McpDataKey = styled.span`
	font-weight: 600;
	color: #5a45bd;
	min-width: 90px;
	max-width: 120px;
	flex-shrink: 0;
	word-break: break-all;
`;

const McpDataVal = styled.span`
	color: #333;
	word-break: break-all;
`;

const McpPagination = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	margin-top: 10px;
	padding: 8px 0;
	font-size: 12px;
	color: #666;
`;

const McpPaginationButtons = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`;

const McpPageBtn = styled.button`
	padding: 4px 10px;
	font-size: 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	background: white;
	cursor: pointer;
	color: #374151;

	&:hover:not(:disabled) {
		background: #f3f4f6;
		border-color: #9ca3af;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ToggleLiveText = styled.span<{ $active: boolean }>`
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
	color: ${(p) => (p.$active ? '#ffdf80' : 'white')};
`;

// ─── Brave web search result card ────────────────────────────────────────────

const BraveResultCard = styled.div`
	margin-top: 12px;
	padding: 10px 12px;
	background: rgba(251, 146, 60, 0.07);
	border: 1px solid rgba(251, 146, 60, 0.3);
	border-radius: 10px;
	display: flex;
	flex-direction: column;
	gap: 6px;
	font-size: 12px;
`;

const BraveResultHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const BraveBadge = styled.span`
	background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
	color: white;
	font-size: 10px;
	font-weight: 700;
	padding: 2px 7px;
	border-radius: 20px;
	letter-spacing: 0.05em;
	white-space: nowrap;
`;

const BraveToolName = styled.code`
	font-size: 12px;
	font-family: 'SFMono-Regular', Consolas, monospace;
	color: #c05300;
	font-weight: 600;
`;

const BraveResultsList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-top: 4px;
`;

const BraveResultItem = styled.div`
	padding: 8px 10px;
	background: white;
	border: 1px solid rgba(251, 146, 60, 0.2);
	border-radius: 8px;
	cursor: pointer;
	transition: background 0.15s;
	&:hover {
		background: #fff7ed;
	}
`;

const BraveResultTitle = styled.div`
	font-size: 12px;
	font-weight: 600;
	color: #1a6fba;
	margin-bottom: 2px;
`;

const BraveResultUrl = styled.div`
	font-size: 10px;
	color: #888;
	font-family: 'SFMono-Regular', Consolas, monospace;
	margin-bottom: 3px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const BraveResultSnippet = styled.div`
	font-size: 11px;
	color: #555;
	line-height: 1.4;
`;

// ─── Groq badge ──────────────────────────────────────────────────────────────

const GroqBadgeRow = styled.div`
	margin-top: 8px;
	display: flex;
	align-items: center;
`;

const GroqBadge = styled.span`
	font-size: 10px;
	font-weight: 600;
	color: #7c4dff;
	background: rgba(124, 77, 255, 0.08);
	border: 1px solid rgba(124, 77, 255, 0.25);
	border-radius: 20px;
	padding: 2px 8px;
	letter-spacing: 0.03em;
	white-space: nowrap;
`;

const LiveNudgeButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	margin-top: 10px;
	padding: 7px 14px;
	border-radius: 20px;
	border: 1.5px solid #667eea;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition:
		opacity 0.15s,
		transform 0.15s;
	&:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}
	&:active {
		transform: translateY(0);
	}
`;


export default AIAssistant;
