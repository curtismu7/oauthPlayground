/**
 * LLM provider resolution for the AI Assistant backend.
 * Supports llama.cpp (OpenAI-compatible local server), Groq (legacy fallback),
 * OpenAI cloud (explicit AI_PROVIDER=openai only), and Anthropic (planned).
 *
 * IMPORTANT: OPENAI_API_KEY is commonly used as the bearer token for a local
 * llama.cpp server — NOT for api.openai.com unless AI_PROVIDER=openai.
 */

const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini';
const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const LLAMA_CPP_DEFAULT_BASE = 'http://localhost:8080/v1';
const LLAMA_CPP_DEFAULT_MODEL = 'local';

/** Returns true when the value is missing or a placeholder from .env.example */
export function isPlaceholderKey(value) {
	return !value || value.includes('your_') || value.includes('placeholder');
}

/** Normalizes AI_PROVIDER env (auto | openai | llama.cpp | groq | anthropic). */
export function getAiProviderSetting() {
	const raw = (process.env.AI_PROVIDER || 'auto').trim().toLowerCase();
	if (raw === 'llama' || raw === 'llama_cpp' || raw === 'llamacpp') return 'llama.cpp';
	return raw;
}

/** True when OPENAI_API_KEY is set for OpenAI cloud (AI_PROVIDER=openai only). */
export function isOpenAiConfigured() {
	return !isPlaceholderKey(process.env.OPENAI_API_KEY);
}

export function isGroqConfigured() {
	return !isPlaceholderKey(process.env.GROQ_API_KEY);
}

/** True when ANTHROPIC_API_KEY is set (provider not yet implemented). */
export function isAnthropicConfigured() {
	return !isPlaceholderKey(process.env.ANTHROPIC_API_KEY);
}

/** Base URL for llama.cpp OpenAI-compatible server (no trailing slash). */
export function getLlamaCppBaseUrl() {
	return (process.env.LLAMA_CPP_BASE_URL || LLAMA_CPP_DEFAULT_BASE).replace(/\/$/, '');
}

/**
 * Bearer token for llama.cpp OpenAI-compatible server.
 * LLAMA_CPP_API_KEY takes precedence; OPENAI_API_KEY is the common alias.
 */
export function getLlamaCppApiKey() {
	const explicit = process.env.LLAMA_CPP_API_KEY;
	if (explicit && !isPlaceholderKey(explicit)) return explicit;
	const openAiAlias = process.env.OPENAI_API_KEY;
	if (openAiAlias && !isPlaceholderKey(openAiAlias)) return openAiAlias;
	return 'no-key';
}

/**
 * Pick the active LLM backend.
 * auto: llama.cpp (local) → Groq (legacy). Never infers OpenAI cloud from OPENAI_API_KEY.
 * openai: OpenAI cloud only when explicitly requested and key is set.
 */
export function resolveLlmProvider() {
	const setting = getAiProviderSetting();

	if (setting === 'openai') {
		return isOpenAiConfigured() ? 'openai' : null;
	}
	if (setting === 'llama.cpp') {
		return 'llama.cpp';
	}
	if (setting === 'groq') {
		return isGroqConfigured() ? 'groq' : null;
	}
	if (setting === 'anthropic') {
		// Future: Anthropic Messages API — stub returns null until implemented.
		return null;
	}
	if (setting !== 'auto') {
		return null;
	}

	if (getLlamaCppBaseUrl()) return 'llama.cpp';
	if (isGroqConfigured()) return 'groq';
	return null;
}

/** Model name for the resolved provider. */
export function getModelForProvider(provider) {
	switch (provider) {
		case 'openai':
			return process.env.OPENAI_MODEL || OPENAI_DEFAULT_MODEL;
		case 'llama.cpp':
			return process.env.LLAMA_CPP_MODEL || LLAMA_CPP_DEFAULT_MODEL;
		case 'groq':
			return process.env.GROQ_MODEL || GROQ_DEFAULT_MODEL;
		default:
			return OPENAI_DEFAULT_MODEL;
	}
}

/** Human-readable provider label for logs and /api/llm/status. */
export function getProviderLabel(provider) {
	switch (provider) {
		case 'openai':
			return 'OpenAI';
		case 'llama.cpp':
			return 'llama.cpp';
		case 'groq':
			return 'Groq';
		case 'anthropic':
			return 'Anthropic';
		default:
			return provider;
	}
}

/** Status payload for GET /api/llm/status */
export function getLlmStatus() {
	const setting = getAiProviderSetting();
	const provider = resolveLlmProvider();
	if (!provider) {
		const anthropicNote =
			setting === 'anthropic'
				? ' Anthropic support is planned but not yet implemented.'
				: '';
		return {
			available: false,
			provider: null,
			setting,
			model: null,
			message:
				`No LLM configured. Start llama.cpp (LLAMA_CPP_BASE_URL), set GROQ_API_KEY, or set AI_PROVIDER=openai with a cloud key.${anthropicNote} See .env.example.`,
		};
	}
	return {
		available: true,
		provider,
		setting,
		model: getModelForProvider(provider),
		label: getProviderLabel(provider),
	};
}

/**
 * Build fetch config for OpenAI-compatible chat/completions.
 * @param {string} provider
 * @param {{ messages: Array, systemPrompt: string, stream?: boolean, maxTokens?: number, temperature?: number }} opts
 */
export function buildChatCompletionConfig(provider, opts) {
	const {
		messages,
		systemPrompt,
		stream = false,
		maxTokens = stream ? 2048 : 1024,
		temperature = 0.6,
	} = opts;

	const model = getModelForProvider(provider);
	const payload = {
		model,
		messages: [{ role: 'system', content: systemPrompt }, ...messages],
		max_tokens: maxTokens,
		temperature,
	};
	if (stream) payload.stream = true;

	let url;
	let apiKey;

	switch (provider) {
		case 'openai':
			url = 'https://api.openai.com/v1/chat/completions';
			apiKey = process.env.OPENAI_API_KEY;
			break;
		case 'llama.cpp':
			url = `${getLlamaCppBaseUrl()}/chat/completions`;
			apiKey = getLlamaCppApiKey();
			break;
		case 'groq':
			url = 'https://api.groq.com/openai/v1/chat/completions';
			apiKey = process.env.GROQ_API_KEY;
			break;
		case 'anthropic':
			throw new Error(
				'Anthropic provider is not yet implemented. Set AI_PROVIDER=llama.cpp, groq, or openai.',
			);
		default:
			throw new Error(`Unknown LLM provider: ${provider}`);
	}

	return {
		url,
		provider,
		model,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: payload,
	};
}

/** Configuration hint when no provider is available. */
export function getLlmNotConfiguredMessage() {
	const setting = getAiProviderSetting();
	if (setting === 'openai') {
		return 'OPENAI_API_KEY is not set. Add a cloud API key to .env or the API key configuration.';
	}
	if (setting === 'llama.cpp') {
		return `llama.cpp server not reachable. Start it and set LLAMA_CPP_BASE_URL (default ${LLAMA_CPP_DEFAULT_BASE}). Bearer: LLAMA_CPP_API_KEY or OPENAI_API_KEY.`;
	}
	if (setting === 'groq') {
		return 'GROQ_API_KEY is not set. Add it to .env or the API key configuration.';
	}
	if (setting === 'anthropic') {
		return 'Anthropic provider support is planned but not yet implemented. Set AI_PROVIDER=llama.cpp or groq.';
	}
	return 'No LLM configured. Start llama.cpp locally, set GROQ_API_KEY, or set AI_PROVIDER=openai with a cloud key.';
}
