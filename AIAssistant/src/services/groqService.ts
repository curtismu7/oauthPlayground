import { apiKeyService } from './apiKeyService';

export interface GroqMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

export interface GroqResponse {
	content: string;
	model?: string;
	usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
	provider?: string;
	/** Set when the backend has no LLM provider configured */
	notConfigured?: boolean;
	error?: string;
}

export interface LlmStatus {
	available: boolean;
	provider?: string | null;
	setting?: string;
	model?: string | null;
	label?: string;
	message?: string;
}

/** When true, server uses the Live-on prompt (no "Live toggle is off" nudge) */
export interface CallGroqOptions {
	includeLive?: boolean;
}

/**
 * Returns LLM backend status from the server (OpenAI, llama.cpp, or Groq).
 */
export async function getLlmStatus(): Promise<LlmStatus> {
	try {
		const res = await fetch('/api/llm/status');
		return res.json();
	} catch {
		return { available: false, provider: null, message: 'Could not reach LLM status endpoint' };
	}
}

/**
 * Send a chat message to the configured LLM via the backend.
 * Routes through OpenAI, llama.cpp, or Groq based on AI_PROVIDER / env.
 */
export async function callGroq(
	userMessage: string,
	history: GroqMessage[] = [],
	opts?: CallGroqOptions,
): Promise<GroqResponse> {
	const messages: GroqMessage[] = [...history, { role: 'user', content: userMessage }];

	const response = await fetch('/api/groq/chat', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ messages, includeLive: opts?.includeLive }),
	});

	if (response.status === 503) {
		return { content: '', notConfigured: true };
	}

	if (!response.ok) {
		const err = await response.json().catch(() => ({ message: response.statusText }));
		throw new Error(err.message || `LLM API error: ${response.status}`);
	}

	return response.json();
}

/**
 * Returns true when the server has a working LLM backend.
 * Syncs stored OpenAI or Groq keys to the backend when needed.
 */
export async function isGroqAvailable(): Promise<boolean> {
	try {
		const status = await getLlmStatus();
		if (status.available) return true;

		// llama.cpp needs no browser-stored key; only sync cloud providers
		for (const service of ['openai', 'groq'] as const) {
			const res = await fetch(`/api/api-key/${service}`);
			const data = await res.json();
			if (data.success === true && data.apiKey) return true;

			const stored = await apiKeyService.getApiKey(service);
			if (stored) {
				await apiKeyService.storeApiKey(service, stored);
				return true;
			}
		}
		return false;
	} catch {
		return false;
	}
}

/**
 * Stream an LLM response token-by-token via the SSE endpoint.
 */
export async function callGroqStream(
	userMessage: string,
	history: GroqMessage[],
	onToken: (token: string) => void,
	onDone: (fullContent: string) => void,
	onError: (err: Error) => void,
	opts?: CallGroqOptions,
): Promise<void> {
	const messages: GroqMessage[] = [...history, { role: 'user', content: userMessage }];

	try {
		const response = await fetch('/api/groq/chat/stream', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages, includeLive: opts?.includeLive }),
		});

		if (response.status === 503) {
			onError(new Error('llm_not_configured'));
			return;
		}

		if (!response.ok || !response.body) {
			const result = await callGroq(userMessage, history, opts);
			if (result.notConfigured) {
				onError(new Error('llm_not_configured'));
				return;
			}
			if (result.content) {
				onToken(result.content);
				onDone(result.content);
			} else {
				onError(new Error(result.error || 'empty LLM response'));
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
				if (payload === '[DONE]') {
					onDone(fullContent);
					return;
				}
				try {
					const parsed = JSON.parse(payload);
					if (parsed.token) {
						fullContent += parsed.token;
						onToken(parsed.token);
					} else if (parsed.error) {
						onError(new Error(parsed.error));
						return;
					}
				} catch {
					/* malformed SSE chunk — skip */
				}
			}
		}

		onDone(fullContent);
	} catch (err) {
		onError(err instanceof Error ? err : new Error(String(err)));
	}
}
