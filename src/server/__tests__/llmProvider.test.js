import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
	buildChatCompletionConfig,
	getAiProviderSetting,
	getLlmStatus,
	getLlamaCppApiKey,
	isOpenAiConfigured,
	resolveLlmProvider,
} from '../llmProvider.js';

describe('llmProvider', () => {
	const envBackup = { ...process.env };

	beforeEach(() => {
		delete process.env.AI_PROVIDER;
		delete process.env.OPENAI_API_KEY;
		delete process.env.GROQ_API_KEY;
		delete process.env.LLAMA_CPP_BASE_URL;
		delete process.env.LLAMA_CPP_API_KEY;
		delete process.env.ANTHROPIC_API_KEY;
	});

	afterEach(() => {
		process.env = { ...envBackup };
	});

	it('defaults AI_PROVIDER to auto', () => {
		expect(getAiProviderSetting()).toBe('auto');
	});

	it('prefers llama.cpp in auto mode even when OPENAI_API_KEY is set', () => {
		process.env.OPENAI_API_KEY = 'sk-local-llama-bearer';
		expect(resolveLlmProvider()).toBe('llama.cpp');
	});

	it('uses llama.cpp in auto mode when no keys are set', () => {
		expect(resolveLlmProvider()).toBe('llama.cpp');
	});

	it('uses groq when AI_PROVIDER=groq and key is configured', () => {
		process.env.AI_PROVIDER = 'groq';
		process.env.GROQ_API_KEY = 'gsk-test-key';
		expect(resolveLlmProvider()).toBe('groq');
	});

	it('forces openai cloud only when AI_PROVIDER=openai and key is configured', () => {
		process.env.AI_PROVIDER = 'openai';
		expect(resolveLlmProvider()).toBeNull();
		process.env.OPENAI_API_KEY = 'sk-cloud-key';
		expect(resolveLlmProvider()).toBe('openai');
	});

	it('builds OpenAI cloud chat completion config when provider is openai', () => {
		process.env.OPENAI_API_KEY = 'sk-cloud-key';
		process.env.OPENAI_MODEL = 'gpt-4o-mini';
		const config = buildChatCompletionConfig('openai', {
			messages: [{ role: 'user', content: 'hello' }],
			systemPrompt: 'system',
		});
		expect(config.url).toBe('https://api.openai.com/v1/chat/completions');
		expect(config.body.model).toBe('gpt-4o-mini');
		expect(config.headers.Authorization).toBe('Bearer sk-cloud-key');
	});

	it('uses OPENAI_API_KEY as llama.cpp bearer when LLAMA_CPP_API_KEY is absent', () => {
		process.env.OPENAI_API_KEY = 'local-bearer-token';
		expect(getLlamaCppApiKey()).toBe('local-bearer-token');
		const config = buildChatCompletionConfig('llama.cpp', {
			messages: [{ role: 'user', content: 'hello' }],
			systemPrompt: 'system',
		});
		expect(config.url).toBe('http://localhost:8080/v1/chat/completions');
		expect(config.headers.Authorization).toBe('Bearer local-bearer-token');
	});

	it('prefers LLAMA_CPP_API_KEY over OPENAI_API_KEY for llama.cpp auth', () => {
		process.env.LLAMA_CPP_API_KEY = 'explicit-llama-key';
		process.env.OPENAI_API_KEY = 'openai-alias-key';
		expect(getLlamaCppApiKey()).toBe('explicit-llama-key');
	});

	it('reports unavailable status when nothing is configured and provider is openai', () => {
		process.env.AI_PROVIDER = 'openai';
		const status = getLlmStatus();
		expect(status.available).toBe(false);
		expect(status.provider).toBeNull();
	});

	it('reports anthropic as unavailable with planned message', () => {
		process.env.AI_PROVIDER = 'anthropic';
		process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
		const status = getLlmStatus();
		expect(status.available).toBe(false);
		expect(status.message).toContain('Anthropic');
	});

	it('detects placeholder OpenAI keys as unconfigured', () => {
		process.env.OPENAI_API_KEY = 'your_openai_api_key_here';
		expect(isOpenAiConfigured()).toBe(false);
		expect(getLlamaCppApiKey()).toBe('no-key');
	});
});
