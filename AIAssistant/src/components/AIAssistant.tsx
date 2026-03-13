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
	isMcpQuery,
	isHelpQuery,
	isWorkerTokenQuery,
	isWebSearchQuery,
	type McpQueryResult,
} from '../services/mcpQueryService';
import { callGroqStream, isGroqAvailable, type GroqMessage } from '../services/groqService';
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
const MESSAGE_TTL_MS = 30 * 60 * 1000; // 30 min

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

// ─── MCP data card renderer ───────────────────────────────────────────────────
// Renders arrays of API result objects as readable key-value cards.
// Falls back to a <pre> code block for arrays of primitives.

function renderMcpDataItems(data: unknown[]): React.ReactNode {
	const MAX_ITEMS = 5;
	const shown = data.slice(0, MAX_ITEMS);
	const overflow = data.length - MAX_ITEMS;
	const first = shown[0];

	if (typeof first !== 'object' || first === null) {
		return (
			<McpDataPre>
				{JSON.stringify(shown, null, 2)}
				{overflow > 0 ? `\n… +${overflow} more` : ''}
			</McpDataPre>
		);
	}

	return (
		<McpDataItemList>
			{shown.map((item, idx) => {
				const obj = item as Record<string, unknown>;
				return (
					<McpDataItem key={idx}>
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
			{overflow > 0 && (
				<McpDataMoreNote>
					+{overflow} more item{overflow !== 1 ? 's' : ''}
				</McpDataMoreNote>
			)}
		</McpDataItemList>
	);
}

const WELCOME_MESSAGE: Message = {
	id: '1',
	type: 'assistant',
	content:
		"Hi! I'm your OAuth Playground assistant. I can help you:\n\n• Find the right OAuth flow for your needs\n• Explain OAuth and OIDC concepts\n• Guide you through configuration\n• Troubleshoot issues\n\nWhat would you like to know?",
	timestamp: new Date(),
};

const AIAssistant: React.FC<AIAssistantProps> = ({ fullPage = false, onStartOAuthFlow }) => {
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
	const navigate = useNavigate();

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

	useEffect(() => {
		if (messages.length === 0) {
			return;
		}

		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

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

	const handleCopyMessage = useCallback((id: string, content: string) => {
		navigator.clipboard.writeText(content).then(() => {
			setCopiedMessage(id);
			setTimeout(() => setCopiedMessage(null), 1800);
		});
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

	const handleSend = async () => {
		if (!input.trim()) return;

		const query = input;
		const userMessage: Message = {
			id: Date.now().toString(),
			type: 'user',
			content: query,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput('');
		setIsTyping(true);

		// Worker-token and help queries always go to MCP.
		// Any PingOne-actionable query (isMcpQuery) with Live ON → MCP for real data.
		// Any PingOne-actionable query with Live OFF → show a helpful "turn on Live" nudge
		// rather than letting Groq fake the response with invented data.
		if (isMcpQuery(query) && !includeLive && !isWorkerTokenQuery(query) && !isHelpQuery(query)) {
			setMessages((prev) => [
				...prev,
				{
					id: (Date.now() + 1).toString(),
					type: 'assistant',
					content:
						"🔌 **Live MCP is off.**\n\nTurn on the **Live** toggle in the header to execute this command against your real PingOne environment.\n\nI won't guess or simulate PingOne data — only the MCP tool can return real results.",
					timestamp: new Date(),
				},
			]);
			setIsTyping(false);
			return;
		}

		if (isWorkerTokenQuery(query) || isHelpQuery(query) || (includeLive && isMcpQuery(query))) {
			try {
				// Pull stored credentials from our storage service (IndexedDB + SQLite)
				const tokenData = unifiedWorkerTokenService.getTokenDataSync();
				const mcpResult = await callMcpQuery(query, {
					workerToken: tokenData?.token || undefined,
					environmentId: tokenData?.credentials?.environmentId || undefined,
					region: (tokenData?.credentials?.region as string) || undefined,
				});
				const assistantMessage: Message = {
					id: (Date.now() + 1).toString(),
					type: 'assistant',
					content: mcpResult.answer,
					mcpResult,
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, assistantMessage]);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				setMessages((prev) => [
					...prev,
					{
						id: (Date.now() + 1).toString(),
						type: 'assistant',
						content: `MCP query failed: ${message}`,
						timestamp: new Date(),
					},
				]);
			} finally {
				setIsTyping(false);
			}
			return;
		}

		// All other queries: Groq streams the answer token-by-token, then we optionally
		// attach a live MCP data card (Live toggle) and/or Brave web results.
		const streamingId = (Date.now() + 1).toString();

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
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleLinkClick = (path: string, external?: boolean) => {
		if (external) {
			window.open(path, '_blank', 'noopener,noreferrer');
		} else {
			navigate(path);
			setIsOpen(false);
		}
	};

	const promptCategories = [
		{
			label: '🔑 Auth',
			prompts: ['Get worker token'],
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
			label: '❓ Help',
			prompts: [
				'What can I do in chat?',
				'What is PKCE?',
				"What's the difference between OAuth and OIDC?",
			],
		},
	];

	const quickQuestions = [
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
															setInput(p);
															setShowPromptsGuide(false);
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

					<ChatWindow
						$expanded={!fullPage && isExpanded}
						$collapsed={!fullPage && isCollapsed}
						$fullPage={fullPage}
					>
						<ChatHeader>
							<HeaderContent>
								<AssistantIcon>🤖</AssistantIcon>
								<HeaderText>
									<HeaderTitle>OAuth Assistant</HeaderTitle>
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
								<MessagesContainer>
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
												{/* Copy button — assistant messages only, shown on hover */}
												{message.type === 'assistant' && !message.streaming && (
													<MessageCopyBtn
														type="button"
														$copied={copiedMessage === message.id}
														onClick={() => handleCopyMessage(message.id, message.content)}
														title="Copy message"
														aria-label="Copy message to clipboard"
													>
														{copiedMessage === message.id ? '✓ Copied' : '⎘ Copy'}
													</MessageCopyBtn>
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
													<McpResultCard>
														<McpResultHeader>
															<McpBadge>🔌 MCP</McpBadge>
															<McpToolName>
																{message.mcpResult.mcpTool ?? 'PingOne MCP'}
															</McpToolName>
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
															Array.isArray(message.mcpResult.data) &&
															(message.mcpResult.data as unknown[]).length > 0 && (
																<McpDataSection>
																	<McpDataLabel>
																		Data ({(message.mcpResult.data as unknown[]).length} items)
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
																	{message.mcpResult.rawJson ? (
																		<McpDataPre>
																			{JSON.stringify(message.mcpResult.data, null, 2)}
																		</McpDataPre>
																	) : (
																		renderMcpDataItems(message.mcpResult.data as unknown[])
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
													onClick={() => {
														setInput(question);
														setTimeout(() => handleSend(), 100);
													}}
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
										placeholder="Ask about OAuth flows, features, or configuration..."
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
	background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
	color: white;
	padding: 10px 14px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 8px;
	flex-wrap: nowrap;
	min-height: 0;
`;

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
`;

const AssistantIcon = styled.div`
	font-size: 24px;
	flex-shrink: 0;
`;

const HeaderText = styled.div`
	display: flex;
	flex-direction: column;
`;

const HeaderTitle = styled.div`
	font-weight: 600;
	font-size: 14px;
	white-space: nowrap;
`;

const HeaderSubtitle = styled.div`
	font-size: 12px;
	opacity: 0.9;
`;

const StatusRow = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	margin-top: 4px;
`;

const StatusDot = styled.span<{ $state: 'ok' | 'off' | 'checking' }>`
	display: inline-flex;
	align-items: center;
	gap: 3px;
	font-size: 10px;
	font-weight: 600;
	padding: 2px 7px;
	border-radius: 20px;
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

const McpResultCard = styled.div`
	margin-top: 12px;
	padding: 10px 12px;
	background: rgba(102, 126, 234, 0.07);
	border: 1px solid rgba(102, 126, 234, 0.25);
	border-radius: 10px;
	display: flex;
	flex-direction: column;
	gap: 6px;
	font-size: 12px;
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

const McpDataMoreNote = styled.div`
	font-size: 11px;
	color: #888;
	text-align: center;
	padding: 4px 0 2px;
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

// ─── Groq not-configured banner ───────────────────────────────────────────────

const GroqBanner = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 8px 14px;
	background: #fffbea;
	border-bottom: 1px solid #f0dc82;
	font-size: 12px;
	color: #7a5c00;
	flex-shrink: 0;
`;

const GroqBannerLink = styled.button`
	background: none;
	border: none;
	font-size: 12px;
	font-weight: 600;
	color: #5a3e00;
	text-decoration: underline;
	cursor: pointer;
	white-space: nowrap;
	padding: 0;
	&:hover {
		color: #3d2a00;
	}
`;

export default AIAssistant;
