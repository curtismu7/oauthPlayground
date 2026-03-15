import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { aiAgentService } from '../services/aiAgentService';
import {
	getTokenStatus,
	refreshAndStoreToken,
	type WorkerTokenStatus,
} from '../services/aiAssistantWorkerTokenService';
import { callGroq, type GroqMessage, isGroqAvailable } from '../services/groqService';
import {
	callMcpQuery,
	callMcpWebSearch,
	decodeJwtHeader,
	decodeJwtPayload,
	isAdminLoginQuery,
	isClearTokensQuery,
	isDecodeTokenQuery,
	isHelpQuery,
	isIntrospectUserTokenQuery,
	isListToolsQuery,
	isMcpQuery,
	isShowApiCallsQuery,
	isShowIdTokenQuery,
	isShowMyTokenQuery,
	isShowWorkerTokenQuery,
	isUserInfoQuery,
	isWebSearchQuery,
	isWorkerTokenQuery,
	type McpQueryResult,
} from '../services/mcpQueryService';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import { notifyHostNavigate, openAIAssistantPopout } from '../utils/aiAssistantPopoutHelper';
import AIAssistantSidePanel from './AIAssistantSidePanel';

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

// ─── MCP data card renderer with paging ───────────────────────────────────────
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
				<McpDataPre>{JSON.stringify(chunk, null, 2)}</McpDataPre>
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

interface AIAssistantProps {
	/** Render as full-page layout instead of floating panel */
	fullPage?: boolean;
	/** When true, running in popout window — internal links notify host to navigate */
	popout?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
	{
		id: '1',
		type: 'assistant',
		content:
			"Hi! I'm your OAuth Playground assistant. I can help you:\n\n• Find the right OAuth flow for your needs\n• Explain OAuth and OIDC concepts\n• Guide you through configuration\n• Troubleshoot issues\n\nWhat would you like to know?",
		timestamp: new Date(),
	},
];

/** Use admin token if it expires at least this many ms in the future. */
const ADMIN_TOKEN_BUFFER_MS = 60_000;

/** A single recorded MCP API call (stored for "show api calls" command). */
interface ApiCallRecord {
	id: string;
	query: string;
	mcpTool: string | null;
	apiCall: { method: string; path: string } | null;
	data: unknown;
	timestamp: Date;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ fullPage = false, popout = false }) => {
	const [isOpen, setIsOpen] = useState(fullPage);
	// fullPage uses compact floating widget; only expand when user clicks
	const [isExpanded, setIsExpanded] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	/** False when user switches away (another tab, minimize); used to hide floating button */
	const [isPageVisible, setIsPageVisible] = useState(() =>
		typeof document !== 'undefined' ? document.visibilityState !== 'hidden' : true
	);
	// Context checkboxes - keeping for future use
	const [includeApis, setIncludeApis] = useState(false);
	const [includeSpecs, setIncludeSpecs] = useState(false);
	const [includeWorkflows, setIncludeWorkflows] = useState(false);
	const [includeUserGuide, setIncludeUserGuide] = useState(false);
	const [includeWeb, setIncludeWeb] = useState(true);
	/** When true, PingOne-actionable queries are sent to /api/mcp/query for live results */
	const [includeLive, setIncludeLive] = useState(true);
	const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
	const [input, setInput] = useState('');
	const [isTyping, setIsTyping] = useState(false);
	const [showRefreshTokenConfirm, setShowRefreshTokenConfirm] = useState(false);
	const [isRefreshingToken, setIsRefreshingToken] = useState(false);
	const [_workerTokenStatus, setWorkerTokenStatus] = useState<WorkerTokenStatus | null>(null);
	const [showPromptsGuide, setShowPromptsGuide] = useState(false);
	const [showSidePanel, setShowSidePanel] = useState(fullPage); // visible by default on full page
	/** Admin token (client credentials) — when set and valid, MCP calls use it instead of worker token */
	const [adminToken, setAdminToken] = useState<string | null>(null);
	const [adminTokenExpiry, setAdminTokenExpiry] = useState<number | null>(null);
	const [adminEnvironmentId, setAdminEnvironmentId] = useState<string | null>(null);
	/** When true, MCP calls use admin token (from side panel Admin tab) when valid; otherwise worker token */
	const [useAdminLogin, setUseAdminLogin] = useState(false);
	/** When true, Admin tab shows only username/password (credentials from Configuration) for "Admin login" command */
	const [adminLoginUsernamePasswordOnly, setAdminLoginUsernamePasswordOnly] = useState(false);
	/** User access token from User login tab (side panel); used for "Introspect user token" */
	const [userAccessToken, setUserAccessToken] = useState<string | null>(null);
	/** ID token from User login tab (OIDC); stored for educational inspection */
	const [idToken, setIdToken] = useState<string | null>(null);
	/** Recent MCP API call records (last 20) — shown by "show api calls" command */
	const [apiCallHistory, setApiCallHistory] = useState<ApiCallRecord[]>([]);
	/** When true (and fullPage), agent results render in the hosting page backdrop instead of only in chat */
	const [showResultsInPage, setShowResultsInPage] = useState(false);
	/** Draggable position (left, top) when user has moved the window; null = use default bottom-right */
	const [assistantPosition, setAssistantPosition] = useState<{ x: number; y: number } | null>(null);
	const [isDraggingAssistant, setIsDraggingAssistant] = useState(false);
	const assistantDragRef = useRef({ startX: 0, startY: 0 });
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
	const pageResultsEndRef = useRef<HTMLDivElement>(null);
	/** Command history for up/down arrow recall (last 50) */
	const commandHistoryRef = useRef<string[]>([]);
	const historyIndexRef = useRef<number>(-1);
	const draftRef = useRef<string>('');
	const navigate = useNavigate();

	// Scroll agent results to bottom when new content arrives (messages, typing, MCP result)
	const scrollMessagesToBottom = useCallback(() => {
		const el = messagesContainerRef.current;
		if (el) {
			el.scrollTop = el.scrollHeight;
		} else {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
		}
	}, []);

	useEffect(() => {
		if (messages.length === 0) return;
		scrollMessagesToBottom();
		// Deferred scroll to catch MCP result cards and other content that renders after paint
		const t = setTimeout(scrollMessagesToBottom, 150);
		return () => clearTimeout(t);
	}, [messages, scrollMessagesToBottom]);

	// Scroll page results to bottom when new assistant message arrives
	useEffect(() => {
		if (!showResultsInPage || !fullPage) return;
		const assistantCount = messages.filter((m) => m.type === 'assistant').length;
		if (assistantCount === 0) return;
		const scroll = () => pageResultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
		scroll();
		const t = setTimeout(scroll, 150); // Defer to catch late-rendering MCP content
		return () => clearTimeout(t);
	}, [messages, showResultsInPage, fullPage]);

	// Reset drag position when assistant is closed so it reopens at default spot
	useEffect(() => {
		if (!isOpen) setAssistantPosition(null);
	}, [isOpen]);

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

	// Load stored user tokens from localStorage on mount (educational persistence)
	useEffect(() => {
		try {
			const stored = localStorage.getItem('ai-assistant-user-token');
			if (stored) {
				const parsed = JSON.parse(stored) as { access_token?: string; id_token?: string };
				if (typeof parsed.access_token === 'string') setUserAccessToken(parsed.access_token);
				if (typeof parsed.id_token === 'string') setIdToken(parsed.id_token);
			}
		} catch {
			// corrupted — ignore
		}
	}, []);

	// Hide floating button when user switches tab, minimizes, or leaves browser
	useEffect(() => {
		const handler = () => setIsPageVisible(document.visibilityState !== 'hidden');
		document.addEventListener('visibilitychange', handler);
		return () => document.removeEventListener('visibilitychange', handler);
	}, []);

	// Load worker token status when assistant opens so we can show refresh option.
	// Also prime credentials (load from SQLite + sync to mcp-config) so MCP backend has creds for "Get worker token".
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

	/** Clears chat history, input, and context; resets to welcome state. */
	const handleClear = useCallback(() => {
		setMessages([{ ...INITIAL_MESSAGES[0], timestamp: new Date() }]);
		setInput('');
		groqHistoryRef.current = [];
		commandHistoryRef.current = [];
		historyIndexRef.current = -1;
		draftRef.current = '';
	}, []);

	/** Store admin token from side panel (client credentials); used for MCP calls until expiry or sign out. */
	const handleAdminTokenSet = useCallback(
		(token: string, expiresInSeconds: number, environmentId: string) => {
			setAdminToken(token);
			setAdminTokenExpiry(Date.now() + expiresInSeconds * 1000);
			setAdminEnvironmentId(environmentId);
		},
		[]
	);

	const handleAdminTokenClear = useCallback(() => {
		setAdminToken(null);
		setAdminTokenExpiry(null);
		setAdminEnvironmentId(null);
	}, []);

	const handleUserTokenSet = useCallback((token: string, _expiresInSeconds: number, receivedIdToken?: string) => {
		setUserAccessToken(token);
		if (receivedIdToken !== undefined) setIdToken(receivedIdToken);
		// Persist to localStorage for educational inspection (see "show my token" / "show id token")
		const record: { access_token: string; stored_at: number; id_token?: string } = {
			access_token: token,
			stored_at: Date.now(),
			...(receivedIdToken !== undefined ? { id_token: receivedIdToken } : {}),
		};
		localStorage.setItem('ai-assistant-user-token', JSON.stringify(record));
	}, []);

	const handleUserTokenClear = useCallback(() => {
		setUserAccessToken(null);
		setIdToken(null);
		localStorage.removeItem('ai-assistant-user-token');
	}, []);

	/** Start dragging the assistant window (header mousedown). */
	const handleAssistantHeaderMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if ((e.target as HTMLElement).closest('button, input, label')) return;
			const rect = (e.currentTarget as HTMLElement)
				.closest('[data-chat-window]')
				?.getBoundingClientRect();
			if (!rect) return;
			setIsDraggingAssistant(true);
			assistantDragRef.current = {
				startX: e.clientX - (assistantPosition?.x ?? rect.left),
				startY: e.clientY - (assistantPosition?.y ?? rect.top),
			};
			if (!assistantPosition) {
				setAssistantPosition({ x: rect.left, y: rect.top });
			}
		},
		[assistantPosition]
	);

	/** Mouse move during drag. */
	useEffect(() => {
		if (!isDraggingAssistant) return;
		const onMove = (e: MouseEvent) => {
			const x = Math.max(
				0,
				Math.min(e.clientX - assistantDragRef.current.startX, window.innerWidth - 520)
			);
			const y = Math.max(0, e.clientY - assistantDragRef.current.startY);
			setAssistantPosition({ x, y });
		};
		const onUp = () => setIsDraggingAssistant(false);
		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);
		return () => {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onUp);
		};
	}, [isDraggingAssistant]);

	/** Send a message. Pass overrideQuery when triggered by prompt chip/quick question to avoid stale closure. */
	const handleSend = useCallback(
		async (overrideQuery?: string) => {
			const query = (overrideQuery ?? input).trim();
			if (!query) return;

			const userMessage: Message = {
				id: Date.now().toString(),
				type: 'user',
				content: query,
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, userMessage]);
			setInput('');
			setIsTyping(true);

			// Add to command history for up/down recall (dedupe consecutive)
			const h = commandHistoryRef.current;
			if (h.length === 0 || h[h.length - 1] !== query) {
				commandHistoryRef.current = [...h.slice(-49), query];
			}
			historyIndexRef.current = -1;
			draftRef.current = '';

			// "Admin login" command: open username/password form in side panel, or tell user to configure first
			if (isAdminLoginQuery(query)) {
				const tokenData = unifiedWorkerTokenService.getTokenDataSync();
				const hasConfig =
					tokenData?.credentials?.environmentId &&
					tokenData?.credentials?.clientId &&
					tokenData?.credentials?.clientSecret;
				if (hasConfig) {
					setUseAdminLogin(true);
					setShowSidePanel(true);
					setAdminLoginUsernamePasswordOnly(true);
					setMessages((prev) => [
						...prev,
						{
							id: crypto.randomUUID(),
							type: 'assistant',
							content:
								'**Admin login** — The form on the left is ready. Enter your **username** and **password** to log in as admin. After you sign in, I\'ll use that token for commands like "list all users".',
							timestamp: new Date(),
						},
					]);
				} else {
					setMessages((prev) => [
						...prev,
						{
							id: crypto.randomUUID(),
							type: 'assistant',
							content:
								'To use **Admin login**, configure the PingOne OIDC client credentials (worker token) in **Configuration** first. You need an application with **Resource Owner Password** grant enabled and Management API scopes. Then say **Admin login** again to open the username/password form.',
							timestamp: new Date(),
						},
					]);
				}
				setIsTyping(false);
				setInput(query); // Restore executed command so user can modify and re-run
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
				localStorage.removeItem('ai-assistant-user-token');
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

			// MCP queries with Live OFF: show nudge to turn on Live (don't let Groq fake PingOne data).
			if (
				isMcpQuery(query) &&
				!includeLive &&
				!isWorkerTokenQuery(query) &&
				!isHelpQuery(query) &&
				!isListToolsQuery(query) &&
				!isAdminLoginQuery(query)
			) {
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

			// All MCP queries with Live ON (or worker-token/help/list-tools/userinfo which work without Live):
			// go straight to MCP and use the result as the primary response.
			if (
				isWorkerTokenQuery(query) ||
				isHelpQuery(query) ||
				isListToolsQuery(query) ||
				isUserInfoQuery(query) ||
				(includeLive && isMcpQuery(query))
			) {
				try {
					const useAdminToken =
						useAdminLogin &&
						!!adminToken &&
						adminTokenExpiry != null &&
						Date.now() < adminTokenExpiry - ADMIN_TOKEN_BUFFER_MS;
					const tokenData = unifiedWorkerTokenService.getTokenDataSync();
					const useUserTokenForIntrospect = isIntrospectUserTokenQuery(query) && !!userAccessToken;
					const mcpResult = await callMcpQuery(query, {
						workerToken: useAdminToken ? adminToken : tokenData?.token || undefined,
						environmentId: useAdminToken
							? adminEnvironmentId || undefined
							: tokenData?.credentials?.environmentId || undefined,
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

			// All other queries: Groq answers conversationally, then optionally attach
			// Brave web results (web toggle or auto-detected spec/docs query).
			try {
				let answer: string;
				let groqUsed = false;
				let localResult: ReturnType<typeof aiAgentService.getAnswer> | null = null;

				const getLocalAnswer = () =>
					aiAgentService.getAnswer(query, {
						includeApiDocs: includeApis,
						includeSpecs,
						includeWorkflows,
						includeUserGuide,
					});

				try {
					const groqResult = await callGroq(query, groqHistoryRef.current, { includeLive });
					if (!groqResult.notConfigured && groqResult.content) {
						answer = groqResult.content;
						groqUsed = true;
						// Maintain rolling 10-turn history for context
						groqHistoryRef.current = [
							...groqHistoryRef.current,
							{ role: 'user', content: query },
							{ role: 'assistant', content: groqResult.content },
						].slice(-20); // keep last 20 entries (10 turns)
					} else {
						// Fallback: local knowledge base — save result for links too
						localResult = getLocalAnswer();
						answer = localResult.answer;
					}
				} catch {
					// Groq failed — fall back to local; save result for links too
					localResult = getLocalAnswer();
					answer = localResult.answer;
				}

				// When Groq was used, fetch local result only for related links (no duplicate answer call)
				if (groqUsed) localResult = null;
				const links: Array<{ title: string; path: string; type: string; external?: boolean }> = (
					localResult?.relatedLinks ?? []
				).map((link) => ({
					title: link.title,
					path: link.path,
					type: link.type,
					external: link.external,
				}));

				// MCP queries are handled above; only non-MCP queries reach here
				let webResult: McpQueryResult | undefined;
				if (includeWeb || isWebSearchQuery(query)) {
					try {
						webResult = await callMcpWebSearch(query);
					} catch {
						// Web search failed; keep local results only
					}
				}

				const assistantMessage: Message = {
					id: crypto.randomUUID(),
					type: 'assistant',
					content: answer,
					links,
					webResult,
					groqUsed,
					timestamp: new Date(),
				};

				setMessages((prev) => [...prev, assistantMessage]);
			} finally {
				setIsTyping(false);
				setInput(query); // Restore executed command so user can modify and re-run
			}
		},
		[
			input,
			includeApis,
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
		]
	);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
			return;
		}
		if (e.key === 'ArrowUp') {
			const h = commandHistoryRef.current;
			if (h.length === 0) return;
			e.preventDefault();
			if (historyIndexRef.current === -1) {
				draftRef.current = input;
				historyIndexRef.current = h.length - 1;
				setInput(h[historyIndexRef.current]);
			} else if (historyIndexRef.current > 0) {
				historyIndexRef.current--;
				setInput(h[historyIndexRef.current]);
			}
			return;
		}
		if (e.key === 'ArrowDown') {
			if (historyIndexRef.current === -1) return;
			e.preventDefault();
			const h = commandHistoryRef.current;
			if (historyIndexRef.current < h.length - 1) {
				historyIndexRef.current++;
				setInput(h[historyIndexRef.current]);
			} else {
				historyIndexRef.current = -1;
				setInput(draftRef.current);
			}
			return;
		}
		// Typing exits history browse mode
		if (historyIndexRef.current >= 0) {
			historyIndexRef.current = -1;
		}
	};

	const handleLinkClick = (path: string, external?: boolean) => {
		if (external) {
			window.open(path, '_blank', 'noopener,noreferrer');
		} else if (popout && window.opener) {
			notifyHostNavigate(path);
		} else {
			navigate(path);
			setIsOpen(false);
		}
	};

	const promptCategories = [
		{
			label: '🔑 Auth',
			prompts: ['Get worker token', 'List MCP tools'],
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
		'What can I do in chat?',
		'What is PKCE?',
		"What's the difference between OAuth and OIDC?",
	];

	/** Shared page results content for fullPage backdrop and floating panel */
	const pageResultsContent = (() => {
		const assistantMessages = messages.filter((m) => m.type === 'assistant');
		if (assistantMessages.length === 0) {
			return <PageResultEmpty>Ask a question to see results here.</PageResultEmpty>;
		}
		return (
			<PageResultContainer>
				<PageResultHeader>
					<span>Agent Results</span>
					<PageResultClearBtn type="button" onClick={handleClear} title="Clear chat and results">
						🗑 Clear
					</PageResultClearBtn>
				</PageResultHeader>
				<PageResultContent>
					{assistantMessages.map((msg, idx) => (
						<React.Fragment key={msg.id}>
							{idx > 0 && <PageResultSeparator />}
							<PageResultBlock>
								<MessageContent>{renderMessageText(msg.content)}</MessageContent>
								{msg.groqUsed && (
									<GroqBadgeRow>
										<GroqBadge>⚡ Groq · Llama 3.3 70B</GroqBadge>
									</GroqBadgeRow>
								)}
								{msg.mcpResult && (
									<McpResultCard $isSuccess={!!msg.mcpResult.success}>
										<McpResultHeader>
											<McpBadge>🔌 MCP</McpBadge>
											<McpToolName>{msg.mcpResult.mcpTool ?? 'PingOne MCP'}</McpToolName>
											{!!msg.mcpResult.success && (
												<McpSuccessBadge>
													{msg.mcpResult.mcpTool === 'pingone_get_worker_token'
														? '✓ Token ready'
														: '✓ Success'}
												</McpSuccessBadge>
											)}
										</McpResultHeader>
										{msg.mcpResult.apiCall && (
											<McpApiRow>
												<McpApiMethod>{msg.mcpResult.apiCall.method}</McpApiMethod>
												<McpApiPath>{msg.mcpResult.apiCall.path}</McpApiPath>
											</McpApiRow>
										)}
										{msg.mcpResult.howItWorks && (
											<McpExplanation>{msg.mcpResult.howItWorks}</McpExplanation>
										)}
										{msg.mcpResult.credentialsRequired && (
											<McpCredentialHint>
												Type <strong>&quot;Get worker token&quot;</strong> to authenticate.
											</McpCredentialHint>
										)}
										{msg.mcpResult.data != null &&
											((Array.isArray(msg.mcpResult.data) &&
												(msg.mcpResult.data as unknown[]).length > 0) ||
												(typeof msg.mcpResult.data === 'object' &&
													Object.keys(msg.mcpResult.data as object).length > 0)) && (
												<McpDataSection>
													<McpDataLabel>
														{Array.isArray(msg.mcpResult.data)
															? `Data (${(msg.mcpResult.data as unknown[]).length} items)`
															: 'Data'}
														<McpJsonToggle
															onClick={() =>
																setMessages((prev) =>
																	prev.map((m) =>
																		m.id === msg.id && m.mcpResult
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
															{msg.mcpResult.rawJson ? '📋 Formatted' : '{ } JSON'}
														</McpJsonToggle>
													</McpDataLabel>
													{msg.mcpResult.rawJson || !Array.isArray(msg.mcpResult.data) ? (
														<McpDataPre>{JSON.stringify(msg.mcpResult.data, null, 2)}</McpDataPre>
													) : (
														<McpDataPagedDisplay
															key={msg.id}
															data={msg.mcpResult.data as unknown[]}
														/>
													)}
												</McpDataSection>
											)}
									</McpResultCard>
								)}
								{msg.webResult &&
									msg.webResult.data != null &&
									Array.isArray(msg.webResult.data) &&
									(msg.webResult.data as BraveResult[]).length > 0 && (
										<BraveResultCard>
											<BraveResultHeader>
												<BraveBadge>🌐 Brave</BraveBadge>
												<BraveToolName>brave_web_search</BraveToolName>
											</BraveResultHeader>
											<BraveResultsList>
												{(msg.webResult.data as BraveResult[]).map((r, i) => (
													<BraveResultItem
														key={i}
														onClick={() => window.open(r.url, '_blank', 'noopener,noreferrer')}
													>
														<BraveResultTitle>{r.title}</BraveResultTitle>
														<BraveResultUrl>{r.url}</BraveResultUrl>
														{r.content && <BraveResultSnippet>{r.content}</BraveResultSnippet>}
													</BraveResultItem>
												))}
											</BraveResultsList>
										</BraveResultCard>
									)}
								{msg.links && msg.links.length > 0 && (
									<LinksContainer>
										<LinksTitle>Related Resources:</LinksTitle>
										{msg.links.map((link, linkIdx) => (
											<LinkItem
												key={linkIdx}
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
							</PageResultBlock>
						</React.Fragment>
					))}
					<div ref={pageResultsEndRef} />
				</PageResultContent>
			</PageResultContainer>
		);
	})();

	return (
		<>
			{/* Floating Button - only show when not in fullPage, chat closed, and page visible (hide when tab/window hidden) */}
			{!fullPage && !isOpen && isPageVisible && (
				<FloatingButton onClick={() => setIsOpen(true)} aria-label="Open MasterFlow Agent">
					<span style={{ fontSize: '24px' }}>💬</span>
					<Pulse />
				</FloatingButton>
			)}

			{/* Page backdrop (blank area) when fullPage - agent talks to this; side panel embedded when showSidePanel */}
			{fullPage && (
				<PageBackdrop $hasResults={showResultsInPage} $hasTools={showSidePanel}>
					{(showResultsInPage || showSidePanel) && (
						<PageBackdropMain>{showResultsInPage && pageResultsContent}</PageBackdropMain>
					)}
					{showSidePanel && (
						<PageToolsSlot $alongsideResults>
							<AIAssistantSidePanel
								isVisible
								onClose={() => {
									setShowSidePanel(false);
									setAdminLoginUsernamePasswordOnly(false);
								}}
								embedded
								onClear={handleClear}
								requestedTab={useAdminLogin ? 'admin' : undefined}
								adminLoginUsernamePasswordOnly={adminLoginUsernamePasswordOnly}
								adminToken={adminToken}
								adminTokenExpiry={adminTokenExpiry}
								adminEnvironmentId={adminEnvironmentId}
								onAdminTokenSet={handleAdminTokenSet}
								onAdminTokenClear={handleAdminTokenClear}
								userAccessToken={userAccessToken}
								onUserTokenSet={handleUserTokenSet}
								onUserTokenClear={handleUserTokenClear}
							/>
						</PageToolsSlot>
					)}
				</PageBackdrop>
			)}

			{/* Chat Window - compact floating when fullPage, else normal */}
			{isOpen && (
				<>
					{isExpanded && !fullPage && <ExpandOverlay onClick={() => setIsExpanded(false)} />}
					{!fullPage && showResultsInPage ? (
						<FloatingLayout>
							<FloatingPagePanel>{pageResultsContent}</FloatingPagePanel>
							<ChatWindow
								$expanded={isExpanded}
								$collapsed={isCollapsed}
								$fullPage={fullPage}
								$compactOnPage={fullPage}
								$inFloatingLayout
							>
								<ChatHeader>
									<HeaderContent>
										<AssistantIcon>🤖</AssistantIcon>
										<HeaderText>
											<HeaderTitle>MasterFlow Agent</HeaderTitle>
											<StatusRow>
												<StatusDot
													$state={
														groqAvailable === null ? 'checking' : groqAvailable ? 'ok' : 'off'
													}
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
																	if (popout) notifyHostNavigate('/configuration');
																	else {
																		navigate('/configuration');
																		setIsOpen(false);
																	}
																}
															: undefined
													}
													style={{ cursor: groqAvailable === false ? 'pointer' : 'default' }}
												>
													⚡ Groq
												</StatusDot>
												<StatusDot
													$state={
														braveAvailable === null ? 'checking' : braveAvailable ? 'ok' : 'off'
													}
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
																	if (popout) notifyHostNavigate('/configuration');
																	else {
																		navigate('/configuration');
																		setIsOpen(false);
																	}
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
																	if (popout) notifyHostNavigate('/configuration');
																	else {
																		navigate('/configuration');
																		setIsOpen(false);
																	}
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
										<ToggleContainer title="Show results in a page panel next to the agent">
											<ToggleLabel>
												<ToggleCheckbox
													type="checkbox"
													checked={showResultsInPage}
													onChange={(e) => setShowResultsInPage(e.target.checked)}
													aria-label="Show results in page"
													title="Show results in a page panel next to the agent"
												/>
												<ToggleText>Page</ToggleText>
											</ToggleLabel>
										</ToggleContainer>
										<ToggleContainer title="Show tools panel for PingOne login, docs, and configuration">
											<ToggleLabel>
												<ToggleCheckbox
													type="checkbox"
													checked={showSidePanel}
													onChange={(e) => setShowSidePanel(e.target.checked)}
													aria-label="Show Configure panel for tools and PingOne login"
													title="Show tools panel for PingOne login, docs, and configuration"
												/>
												<ToggleText>Configure</ToggleText>
											</ToggleLabel>
										</ToggleContainer>
										<ToggleContainer title="Include PingOne API reference docs in context">
											<ToggleLabel>
												<ToggleCheckbox
													type="checkbox"
													checked={includeApis}
													onChange={(e) => setIncludeApis(e.target.checked)}
													aria-label="Include PingOne API reference docs"
													title="Include PingOne API reference docs in context"
												/>
												<ToggleText>APIs</ToggleText>
											</ToggleLabel>
										</ToggleContainer>
										<ToggleContainer title="Include OAuth 2.0 and OIDC specifications in context">
											<ToggleLabel>
												<ToggleCheckbox
													type="checkbox"
													checked={includeSpecs}
													onChange={(e) => setIncludeSpecs(e.target.checked)}
													aria-label="Include OAuth/OIDC specifications"
													title="Include OAuth 2.0 and OIDC specifications in context"
												/>
												<ToggleText>Specs</ToggleText>
											</ToggleLabel>
										</ToggleContainer>
										<ToggleContainer title="Include PingOne workflow guides in context">
											<ToggleLabel>
												<ToggleCheckbox
													type="checkbox"
													checked={includeWorkflows}
													onChange={(e) => setIncludeWorkflows(e.target.checked)}
													aria-label="Include PingOne workflows"
													title="Include PingOne workflow guides in context"
												/>
												<ToggleText>Workflows</ToggleText>
											</ToggleLabel>
										</ToggleContainer>
										<ToggleContainer title="Include the OAuth Playground user guide in context">
											<ToggleLabel>
												<ToggleCheckbox
													type="checkbox"
													checked={includeUserGuide}
													onChange={(e) => setIncludeUserGuide(e.target.checked)}
													aria-label="Include User Guide"
													title="Include the OAuth Playground user guide in context"
												/>
												<ToggleText>Guide</ToggleText>
											</ToggleLabel>
										</ToggleContainer>
										<ToggleContainer title="Include live web results via Brave Search. Requires BRAVE_API_KEY on the server (see .env).">
											<ToggleLabel>
												<ToggleCheckbox
													type="checkbox"
													checked={includeWeb}
													onChange={(e) => setIncludeWeb(e.target.checked)}
													aria-label="Include web search results (Brave Search; needs BRAVE_API_KEY on server)"
													title="Include live web results via Brave Search. Requires BRAVE_API_KEY on the server."
												/>
												<ToggleText>Web</ToggleText>
												<ToggleHint>(Brave)</ToggleHint>
											</ToggleLabel>
										</ToggleContainer>
										<ToggleContainer title="Call PingOne live via MCP tools. Requires PINGONE_ENVIRONMENT_ID + PINGONE_WORKER_TOKEN on the server.">
											<ToggleLabel>
												<ToggleCheckbox
													type="checkbox"
													checked={includeLive}
													onChange={(e) => setIncludeLive(e.target.checked)}
													aria-label="Call PingOne live via MCP tools (requires credentials on server)"
													title="Call PingOne live via MCP tools. Requires credentials on the server."
												/>
												<ToggleLiveText $active={includeLive}>Live</ToggleLiveText>
												<ToggleHint>(MCP)</ToggleHint>
											</ToggleLabel>
										</ToggleContainer>
										<ToggleContainer title="Use Admin login token for MCP calls. Get token in side panel → Admin tab.">
											<ToggleLabel>
												<ToggleCheckbox
													type="checkbox"
													checked={useAdminLogin}
													onChange={(e) => {
														const checked = e.target.checked;
														setUseAdminLogin(checked);
														if (checked) setShowSidePanel(true);
													}}
													aria-label="Use Admin login token for MCP (get token in side panel Admin tab)"
													title="Use Admin login token for MCP calls. Get token in side panel → Admin tab."
												/>
												<ToggleLiveText $active={useAdminLogin}>Admin</ToggleLiveText>
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
										<RefreshTokenButton
											type="button"
											onClick={() => window.dispatchEvent(new Event('open-log-viewer'))}
											aria-label="Open log viewer to see MCP calls"
											title="Open log viewer — see MCP calls, API requests, and server logs"
										>
											📋
										</RefreshTokenButton>
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
										{!popout && !fullPage && (
											<ExpandButton
												type="button"
												onClick={() => {
													const opened = openAIAssistantPopout();
													if (opened) {
														setIsOpen(false);
														setIsExpanded(false);
														setIsCollapsed(false);
													}
												}}
												aria-label="Open in popout window"
												title="Open in popout window — move outside host page, still communicates with it"
											>
												<span style={{ fontSize: '16px' }}>🔗</span>
											</ExpandButton>
										)}
										<ClearButton
											type="button"
											onClick={handleClear}
											aria-label="Clear chat"
											title="Clear chat and start fresh"
										>
											<span style={{ fontSize: '16px' }}>🗑</span>
											Clear
										</ClearButton>
										<CloseButton
											onClick={() => {
												if (popout && typeof window !== 'undefined' && window.close) {
													window.close();
												} else if (fullPage) {
													navigate('/');
												} else {
													setIsOpen(false);
													setIsExpanded(false);
													setIsCollapsed(false);
												}
											}}
											title={
												popout
													? 'Close popout window'
													: fullPage
														? 'Go back to home'
														: 'Close assistant (Esc)'
											}
										>
											<span style={{ fontSize: '20px' }}>❌</span>
										</CloseButton>
									</HeaderActions>
								</ChatHeader>

								{!isCollapsed && (
									<>
										<MessagesContainer ref={messagesContainerRef}>
											{messages.map((message) => (
												<MessageWrapper key={message.id} $isUser={message.type === 'user'}>
													<MessageBubble $isUser={message.type === 'user'}>
														<MessageContent>{renderMessageText(message.content)}</MessageContent>
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
																			Object.keys(message.mcpResult.data as object).length >
																				0)) && (
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
																			{message.mcpResult.rawJson ||
																			!Array.isArray(message.mcpResult.data) ? (
																				<McpDataPre>
																					{JSON.stringify(message.mcpResult.data, null, 2)}
																				</McpDataPre>
																			) : (
																				<McpDataPagedDisplay
																					key={message.id}
																					data={message.mcpResult.data as unknown[]}
																				/>
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
																		💡 Add your Brave Search API key in the Configuration page to
																		enable web search.
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
															onClick={() => {
																setInput(question);
																handleSend(question);
															}}
														>
															{question}
														</QuickQuestionButton>
													))}
												</QuickQuestionsContainer>
											)}

											<div ref={messagesEndRef} />
										</MessagesContainer>

										{/* Prompts Guide Panel — slides up over message area */}
										{showPromptsGuide && (
											<PromptsGuidePanel>
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
													Click any prompt to use it. Start with{' '}
													<strong>&quot;Get worker token&quot;</strong> for live data.
												</PromptsGuideSubtitle>
												<PromptsGuideScroll>
													{promptCategories.map((cat) => (
														<PromptsCategory key={cat.label}>
															<PromptsCategoryLabel>{cat.label}</PromptsCategoryLabel>
															<PromptsList>
																{cat.prompts.map((p) => (
																	<PromptsChip
																		key={p}
																		type="button"
																		onClick={() => {
																			setInput(p);
																			setShowPromptsGuide(false);
																			handleSend(p);
																		}}
																	>
																		{p}
																	</PromptsChip>
																))}
															</PromptsList>
														</PromptsCategory>
													))}
												</PromptsGuideScroll>
											</PromptsGuidePanel>
										)}

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
												onChange={(e) => {
													if (historyIndexRef.current >= 0) historyIndexRef.current = -1;
													setInput(e.target.value);
												}}
												onKeyDown={handleKeyDown}
												placeholder="Get worker token"
												aria-label="Message input"
											/>
											<SendButton
												onClick={handleSend}
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
						</FloatingLayout>
					) : (
						<ChatWindow
							data-chat-window
							$expanded={isExpanded}
							$collapsed={isCollapsed}
							$fullPage={fullPage}
							$compactOnPage={fullPage}
							{...(assistantPosition && {
								$dragLeft: assistantPosition.x,
								$dragTop: assistantPosition.y,
							})}
						>
							<ChatHeader $draggable onMouseDown={handleAssistantHeaderMouseDown}>
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
																if (popout) notifyHostNavigate('/configuration');
																else {
																	navigate('/configuration');
																	setIsOpen(false);
																}
															}
														: undefined
												}
												style={{ cursor: groqAvailable === false ? 'pointer' : 'default' }}
											>
												⚡ Groq
											</StatusDot>
											<StatusDot
												$state={
													braveAvailable === null ? 'checking' : braveAvailable ? 'ok' : 'off'
												}
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
																if (popout) notifyHostNavigate('/configuration');
																else {
																	navigate('/configuration');
																	setIsOpen(false);
																}
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
																if (popout) notifyHostNavigate('/configuration');
																else {
																	navigate('/configuration');
																	setIsOpen(false);
																}
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
									<ToggleContainer title="Show results in a page panel next to the agent">
										<ToggleLabel>
											<ToggleCheckbox
												type="checkbox"
												title="Show results in a page panel next to the agent"
												checked={showResultsInPage}
												onChange={(e) => setShowResultsInPage(e.target.checked)}
												aria-label="Show results in page"
											/>
											<ToggleText>Page</ToggleText>
										</ToggleLabel>
									</ToggleContainer>
									<ToggleContainer title="Show tools panel for PingOne login, docs, and configuration">
										<ToggleLabel>
											<ToggleCheckbox
												type="checkbox"
												title="Show tools panel for PingOne login, docs, and configuration"
												checked={showSidePanel}
												onChange={(e) => setShowSidePanel(e.target.checked)}
												aria-label="Show Configure panel for tools and PingOne login"
											/>
											<ToggleText>Configure</ToggleText>
										</ToggleLabel>
									</ToggleContainer>
									<ToggleContainer title="Include PingOne API reference docs in context">
										<ToggleLabel>
											<ToggleCheckbox
												type="checkbox"
												title="Include PingOne API reference docs in context"
												checked={includeApis}
												onChange={(e) => setIncludeApis(e.target.checked)}
												aria-label="Include PingOne API reference docs"
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
									<ToggleContainer title="Include PingOne workflows in context">
										<ToggleLabel>
											<ToggleCheckbox
												type="checkbox"
												title="Include PingOne workflows in context"
												checked={includeWorkflows}
												onChange={(e) => setIncludeWorkflows(e.target.checked)}
												aria-label="Include PingOne workflows"
											/>
											<ToggleText>Workflows</ToggleText>
										</ToggleLabel>
									</ToggleContainer>
									<ToggleContainer title="Include User Guide in context">
										<ToggleLabel>
											<ToggleCheckbox
												type="checkbox"
												title="Include User Guide in context"
												checked={includeUserGuide}
												onChange={(e) => setIncludeUserGuide(e.target.checked)}
												aria-label="Include User Guide"
											/>
											<ToggleText>Guide</ToggleText>
										</ToggleLabel>
									</ToggleContainer>
									{fullPage && (
										<ToggleContainer title="Include web search in responses">
											<ToggleLabel>
												<ToggleCheckbox
													type="checkbox"
													title="Include web search in responses"
													checked={includeWeb}
													onChange={(e) => setIncludeWeb(e.target.checked)}
													aria-label="Include web search"
												/>
												<ToggleText>Web</ToggleText>
											</ToggleLabel>
										</ToggleContainer>
									)}
									<ToggleContainer title="Include live PingOne data (MCP) when query is actionable">
										<ToggleLabel>
											<ToggleCheckbox
												type="checkbox"
												title="Include live PingOne data (MCP) when query is actionable"
												checked={includeLive}
												onChange={(e) => setIncludeLive(e.target.checked)}
												aria-label="Include live MCP data"
											/>
											<ToggleText>Live</ToggleText>
										</ToggleLabel>
									</ToggleContainer>
									<ToggleContainer title="Use Admin login token for MCP calls. Get token in side panel → Admin tab.">
										<ToggleLabel>
											<ToggleCheckbox
												type="checkbox"
												checked={useAdminLogin}
												onChange={(e) => {
													const checked = e.target.checked;
													setUseAdminLogin(checked);
													if (checked) setShowSidePanel(true);
												}}
												aria-label="Use Admin login token for MCP (get token in side panel Admin tab)"
												title="Use Admin login token for MCP calls. Get token in side panel → Admin tab."
											/>
											<ToggleText>Admin</ToggleText>
										</ToggleLabel>
									</ToggleContainer>
									<RefreshTokenButton
										type="button"
										onClick={() => window.dispatchEvent(new Event('open-log-viewer'))}
										aria-label="Open log viewer to see MCP calls"
										title="Open log viewer — see MCP calls, API requests, and server logs"
									>
										📋
									</RefreshTokenButton>
									<ClearButton
										type="button"
										onClick={handleClear}
										aria-label="Clear chat"
										title="Clear chat and start fresh"
									>
										<span style={{ fontSize: '16px' }}>🗑</span>
										Clear
									</ClearButton>
									<CloseButton
										onClick={() => {
											setIsOpen(false);
											setIsCollapsed(false);
										}}
										title={
											popout
												? 'Close popout window'
												: fullPage
													? 'Go back to home'
													: 'Close assistant (Esc)'
										}
									>
										<span style={{ fontSize: '20px' }}>❌</span>
									</CloseButton>
								</HeaderActions>
							</ChatHeader>

							{!isCollapsed && (
								<>
									<MessagesContainer ref={messagesContainerRef}>
										{messages.map((message) => (
											<MessageWrapper key={message.id} $isUser={message.type === 'user'}>
												<MessageBubble $isUser={message.type === 'user'}>
													<MessageContent>{renderMessageText(message.content)}</MessageContent>
													{message.groqUsed && (
														<GroqBadgeRow>
															<GroqBadge>⚡ Groq · Llama 3.3 70B</GroqBadge>
														</GroqBadgeRow>
													)}
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
																	Type <strong>&quot;Get worker token&quot;</strong> to
																	authenticate.
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
																		{message.mcpResult.rawJson ||
																		!Array.isArray(message.mcpResult.data) ? (
																			<McpDataPre>
																				{JSON.stringify(message.mcpResult.data, null, 2)}
																			</McpDataPre>
																		) : (
																			<McpDataPagedDisplay
																				key={message.id}
																				data={message.mcpResult.data as unknown[]}
																			/>
																		)}
																	</McpDataSection>
																)}
														</McpResultCard>
													)}
													{message.webResult &&
														message.webResult.data != null &&
														Array.isArray(message.webResult.data) &&
														(message.webResult.data as BraveResult[]).length > 0 && (
															<BraveResultCard>
																<BraveResultHeader>
																	<BraveBadge>🌐 Brave</BraveBadge>
																	<BraveToolName>brave_web_search</BraveToolName>
																</BraveResultHeader>
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
										<div ref={messagesEndRef} />
									</MessagesContainer>
									{showPromptsGuide && (
										<PromptsGuidePanel>
											<PromptsGuideHeader>
												<PromptsGuideTitle>Quick Prompts</PromptsGuideTitle>
												<PromptsGuideClose onClick={() => setShowPromptsGuide(false)}>
													×
												</PromptsGuideClose>
											</PromptsGuideHeader>
											<PromptsGuideScroll>
												{promptCategories.map((cat) => (
													<PromptsCategory key={cat.label}>
														<PromptsCategoryLabel>{cat.label}</PromptsCategoryLabel>
														<PromptsList>
															{cat.prompts.map((p) => (
																<PromptsChip
																	key={p}
																	type="button"
																	onClick={() => {
																		setInput(p);
																		setShowPromptsGuide(false);
																		handleSend(p);
																	}}
																>
																	{p}
																</PromptsChip>
															))}
														</PromptsList>
													</PromptsCategory>
												))}
											</PromptsGuideScroll>
										</PromptsGuidePanel>
									)}

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
											onChange={(e) => {
												if (historyIndexRef.current >= 0) historyIndexRef.current = -1;
												setInput(e.target.value);
											}}
											onKeyDown={handleKeyDown}
											placeholder="Get worker token"
											aria-label="Message input"
										/>
										<SendButton
											onClick={handleSend}
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
					)}
				</>
			)}

			{/* Tools & Resources overlay - only when not fullPage (fullPage uses embedded sidebar above) */}
			{!fullPage && (
				<AIAssistantSidePanel
					isVisible={showSidePanel}
					onClose={() => {
						setShowSidePanel(false);
						setAdminLoginUsernamePasswordOnly(false);
					}}
					onClear={handleClear}
					requestedTab={useAdminLogin ? 'admin' : undefined}
					adminLoginUsernamePasswordOnly={adminLoginUsernamePasswordOnly}
					adminToken={adminToken}
					adminTokenExpiry={adminTokenExpiry}
					adminEnvironmentId={adminEnvironmentId}
					onAdminTokenSet={handleAdminTokenSet}
					onAdminTokenClear={handleAdminTokenClear}
					userAccessToken={userAccessToken}
					onUserTokenSet={handleUserTokenSet}
					onUserTokenClear={handleUserTokenClear}
				/>
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
	box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
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

const FloatingLayout = styled.div`
	position: fixed;
	bottom: 24px;
	right: 90px;
	display: flex;
	flex-direction: row-reverse;
	align-items: flex-end;
	gap: 16px;
	z-index: 1001;
`;

const FloatingPagePanel = styled.div`
	width: 400px;
	height: 680px;
	flex-shrink: 0;
	background: #f8fafc;
	border-radius: 16px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
	overflow: hidden;
	display: flex;
	flex-direction: column;
`;

const PageBackdrop = styled.div<{ $hasResults?: boolean; $hasTools?: boolean }>`
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: ${({ $hasResults, $hasTools }) => ($hasResults && $hasTools ? 'row' : 'column')};
	background: #f8fafc;
`;

/** Main area (results) within PageBackdrop when side panel is shown; flex child for row layout */
const PageBackdropMain = styled.div`
	flex: 1;
	min-width: 0;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

const PageResultContainer = styled.div`
	flex: 1;
	min-width: 0;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	background: white;
	border-right: 1px solid #e2e8f0;
`;

const PageResultHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 20px;
	font-size: 14px;
	font-weight: 600;
	color: #334155;
	background: #f1f5f9;
	border-bottom: 1px solid #e2e8f0;
`;

const PageResultClearBtn = styled.button`
	background: rgba(100, 116, 139, 0.15);
	border: 1px solid #cbd5e1;
	color: #475569;
	padding: 4px 10px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	transition: background 0.2s;

	&:hover {
		background: rgba(100, 116, 139, 0.25);
	}
`;

const PageResultSeparator = styled.div`
	height: 1px;
	background: #e2e8f0;
	margin: 24px 0;
`;

const PageResultBlock = styled.div``;

const PageResultContent = styled.div`
	flex: 1;
	padding: 20px;
	overflow-y: auto;
`;

const PageResultEmpty = styled.div`
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #94a3b8;
	font-size: 14px;
`;

const PageToolsSlot = styled.div<{ $alongsideResults?: boolean }>`
	width: ${({ $alongsideResults }) => ($alongsideResults ? '400px' : '100%')};
	flex: ${({ $alongsideResults }) => ($alongsideResults ? '0 0 400px' : '1')};
	min-height: 0;
	display: flex;
	flex-direction: column;
`;

const ChatWindow = styled.div<{
	$expanded?: boolean;
	$collapsed?: boolean;
	$fullPage?: boolean;
	$compactOnPage?: boolean;
	$inFloatingLayout?: boolean;
	$dragLeft?: number;
	$dragTop?: number;
}>`
	position: ${({ $fullPage, $compactOnPage, $inFloatingLayout }) =>
		$inFloatingLayout
			? 'relative'
			: $fullPage && $compactOnPage
				? 'fixed'
				: $fullPage
					? 'relative'
					: 'fixed'};
	${({
		$expanded,
		$collapsed,
		$fullPage,
		$compactOnPage,
		$inFloatingLayout,
		$dragLeft,
		$dragTop,
	}) => {
		const useDragPos =
			$dragLeft != null &&
			$dragTop != null &&
			!$inFloatingLayout &&
			($fullPage ? $compactOnPage : true);
		if ($inFloatingLayout) {
			return `
    width: 520px;
    height: ${$collapsed ? 'auto' : '680px'};
    flex-shrink: 0;
    `;
		}
		if (useDragPos) {
			return `
    left: ${$dragLeft}px;
    top: ${$dragTop}px;
    bottom: auto;
    right: auto;
    width: 520px;
    height: ${$collapsed ? 'auto' : '680px'};
    transform: none;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    z-index: 1001;
    `;
		}
		if ($fullPage && $compactOnPage) {
			return `
    bottom: 24px;
    right: 90px;
    width: 520px;
    height: ${$collapsed ? 'auto' : '680px'};
    top: auto;
    left: auto;
    transform: none;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    z-index: 1001;
    `;
		}
		if ($fullPage) {
			return `
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    bottom: auto;
    right: auto;
    transform: none;
    border-radius: 0;
    `;
		}
		if ($collapsed) {
			return `
    bottom: 24px;
    right: 90px;
    width: 520px;
    height: auto;
    `;
		}
		if ($expanded) {
			return `
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(1400px, 96vw);
    height: min(95vh, 1100px);
    bottom: auto;
    right: auto;
    `;
		}
		return `
    bottom: 24px;
    right: 90px;
    width: 520px;
    height: 680px;
    `;
	}}
	background: white;
	border-radius: ${({ $fullPage, $compactOnPage }) =>
		$fullPage && !$compactOnPage ? '0' : '16px'};
	box-shadow: ${({ $fullPage, $compactOnPage }) =>
		$fullPage && !$compactOnPage ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.12)'};
	display: flex;
	flex-direction: column;
	z-index: ${({ $fullPage, $compactOnPage }) => ($fullPage && !$compactOnPage ? 'auto' : '1001')};
	overflow: hidden;
	isolation: isolate;
	transition:
		width 0.25s ease,
		height 0.25s ease;

	@media (max-width: 768px) {
		${({ $fullPage, $compactOnPage, $collapsed }) =>
			$fullPage && !$compactOnPage
				? `
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      bottom: auto;
      right: auto;
      transform: none;
      border-radius: 0;
      `
				: $fullPage && $compactOnPage
					? `
      width: calc(100vw - 32px);
      height: ${$collapsed ? 'auto' : 'calc(100vh - 100px)'};
      bottom: 16px;
      right: 16px;
      top: auto;
      left: auto;
      transform: none;
      `
					: `
      width: calc(100vw - 32px);
      height: ${$collapsed ? 'auto' : 'calc(100vh - 100px)'};
      bottom: 16px;
      right: 16px;
      top: auto;
      left: auto;
      transform: none;
      `}
	}
`;

const ChatHeader = styled.div<{ $draggable?: boolean }>`
	background: #dc2626;
	color: white;
	padding: 6px 10px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 6px;
	flex-wrap: wrap;
	min-height: 0;
	cursor: ${({ $draggable }) => ($draggable ? 'grab' : 'default')};
	user-select: ${({ $draggable }) => ($draggable ? 'none' : 'auto')};

	&:active {
		cursor: ${({ $draggable }) => ($draggable ? 'grabbing' : 'default')};
	}
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

const _HeaderSubtitle = styled.div`
	font-size: 11px;
	opacity: 0.9;
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
	width: 14px;
	height: 14px;
	cursor: pointer;
	accent-color: white;
`;

const ToggleText = styled.span`
	font-size: 11px;
	font-weight: 500;
	white-space: nowrap;
`;

const ToggleHint = styled.span`
	font-size: 9px;
	opacity: 0.85;
	white-space: nowrap;
`;

const RefreshTokenButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	width: 28px;
	height: 28px;
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

const CollapseButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	width: 28px;
	height: 28px;
	border-radius: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: background 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.3);
	}
`;

const ClearButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	min-width: 28px;
	height: 28px;
	padding: 0 8px;
	border-radius: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
	cursor: pointer;
	transition: background 0.2s;
	font-size: 13px;

	&:hover {
		background: rgba(255, 255, 255, 0.3);
	}
`;

const ExpandButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	width: 28px;
	height: 28px;
	border-radius: 6px;
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
	width: 28px;
	height: 28px;
	border-radius: 6px;
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
	min-height: 0;
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

const PromptsGuidePanel = styled.div`
	flex-shrink: 0;
	background: white;
	border-top: 1px solid #e0e0e0;
	box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
	display: flex;
	flex-direction: column;
	max-height: 360px;
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

const PromptsChip = styled.button`
	padding: 5px 10px;
	border-radius: 20px;
	border: 1px solid #d8d8e8;
	background: #f4f4fb;
	color: #444;
	font-size: 12px;
	cursor: pointer;
	transition: all 0.15s;
	white-space: nowrap;
	&:hover {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-color: transparent;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.35);
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
		${({ $isSuccess }) => ($isSuccess ? 'rgba(34, 197, 94, 0.5)' : 'rgba(102, 126, 234, 0.25)')};
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

export default AIAssistant;
