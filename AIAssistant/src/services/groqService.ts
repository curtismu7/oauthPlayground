import { apiKeyService } from './apiKeyService';

export interface GroqMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

export interface GroqResponse {
	content: string;
	model?: string;
	usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
	/** Set when the backend has no GROQ_API_KEY configured */
	notConfigured?: boolean;
	error?: string;
}

/**
 * Send a chat message (with optional conversation history) to the Groq LLM via the backend.
 * The backend injects the system prompt and API key — no secrets are exposed to the browser.
 */
export async function callGroq(
	userMessage: string,
	history: GroqMessage[] = [],
): Promise<GroqResponse> {
	const messages: GroqMessage[] = [
		...history,
		{ role: 'user', content: userMessage },
	];

	const response = await fetch('/api/groq/chat', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ messages }),
	});

	if (response.status === 503) {
		return { content: '', notConfigured: true };
	}

	if (!response.ok) {
		const err = await response.json().catch(() => ({ message: response.statusText }));
		throw new Error(err.message || `Groq API error: ${response.status}`);
	}

	return response.json();
}

/**
 * Returns true when the server has a working GROQ_API_KEY.
 * If the server doesn't have it yet but we have it in local storage, syncs it first.
 */
export async function isGroqAvailable(): Promise<boolean> {
	try {
		const res = await fetch('/api/api-key/groq');
		const data = await res.json();
		if (data.success === true && data.apiKey) return true;

		// Backend doesn't have it — try loading from our storage and syncing
		const stored = await apiKeyService.getApiKey('groq');
		if (stored) {
			// storeApiKey also POSTs to /api/api-key/groq to sync the backend
			await apiKeyService.storeApiKey('groq', stored);
			return true;
		}
		return false;
	} catch {
		return false;
	}
}

/**
 * Stream a Groq response token-by-token via the SSE endpoint.
 * Falls back to the regular non-streaming endpoint if the server doesn't support it.
 *
 * @param onToken - called for every streamed token
 * @param onDone  - called once when the stream ends, receives the full content
 * @param onError - called if the stream fails (caller can fall back to local KB)
 */
export async function callGroqStream(
	userMessage: string,
	history: GroqMessage[],
	onToken: (token: string) => void,
	onDone: (fullContent: string) => void,
	onError: (err: Error) => void,
): Promise<void> {
	const messages: GroqMessage[] = [...history, { role: 'user', content: userMessage }];

	try {
		const response = await fetch('/api/groq/chat/stream', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages }),
		});

		if (response.status === 503) {
			// Groq not configured — fall through to error handler so caller can use local KB
			onError(new Error('groq_not_configured'));
			return;
		}

		if (!response.ok || !response.body) {
			// Server doesn't support streaming — fall back to regular endpoint
			const result = await callGroq(userMessage, history);
			if (result.notConfigured) { onError(new Error('groq_not_configured')); return; }
			if (result.content) {
				onToken(result.content);
				onDone(result.content);
			} else {
				onError(new Error(result.error || 'empty groq response'));
			}
			return;
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let fullContent = '';

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';
			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed || !trimmed.startsWith('data:')) continue;
				const payload = trimmed.slice(5).trim();
				if (payload === '[DONE]') { onDone(fullContent); return; }
				try {
					const parsed = JSON.parse(payload);
					if (parsed.token) {
						fullContent += parsed.token;
						onToken(parsed.token);
					} else if (parsed.error) {
						onError(new Error(parsed.error));
						return;
					}
				} catch { /* malformed SSE chunk — skip */ }
			}
		}

		// Stream ended without [DONE] — still treat as success
		onDone(fullContent);
	} catch (err) {
		onError(err instanceof Error ? err : new Error(String(err)));
	}
}
