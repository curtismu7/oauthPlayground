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
export interface CallGroqOptions {
	/** When true, server uses the Live-on prompt (no "Live toggle is off" nudge) */
	includeLive?: boolean;
}

export async function callGroq(
	userMessage: string,
	history: GroqMessage[] = [],
	opts?: CallGroqOptions
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
