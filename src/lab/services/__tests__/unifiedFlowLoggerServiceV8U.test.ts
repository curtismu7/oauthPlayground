/**
 * @file unifiedFlowLoggerServiceV8U.test.ts
 * @module v8u/services/__tests__
 * @description Unit tests for unified flow logger service
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { unifiedFlowLoggerService } from '../unifiedFlowLoggerServiceV8U';

describe('unifiedFlowLoggerServiceV8U', () => {
	const _originalConsole = { ...console };

	beforeEach(() => {
		vi.spyOn(console, 'info').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'debug').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		unifiedFlowLoggerService.clearHistory();
	});

	describe('log level filtering', () => {
		it('shouldLog returns true for levels >= minimum', () => {
			unifiedFlowLoggerService.setMinimumLogLevel('debug');
			expect(unifiedFlowLoggerService.shouldLog('debug')).toBe(true);
			expect(unifiedFlowLoggerService.shouldLog('info')).toBe(true);
			expect(unifiedFlowLoggerService.shouldLog('warn')).toBe(true);
			expect(unifiedFlowLoggerService.shouldLog('error')).toBe(true);

			unifiedFlowLoggerService.setMinimumLogLevel('warn');
			expect(unifiedFlowLoggerService.shouldLog('debug')).toBe(false);
			expect(unifiedFlowLoggerService.shouldLog('info')).toBe(false);
			expect(unifiedFlowLoggerService.shouldLog('warn')).toBe(true);
			expect(unifiedFlowLoggerService.shouldLog('error')).toBe(true);
		});
	});

	describe('credential sanitization', () => {
		it('sanitizes clientSecret in credentials', () => {
			const creds = {
				environmentId: 'env-1',
				clientId: 'client-1',
				clientSecret: 'secret-123',
			};
			const sanitized = unifiedFlowLoggerService.sanitizeCredentials(creds);
			expect(sanitized?.clientSecret).toBe('[REDACTED]');
			expect(sanitized?.clientId).toBe('client-1');
		});

		it('sanitizes privateKey in credentials', () => {
			const creds = {
				environmentId: 'env-1',
				privateKey: '-----BEGIN PRIVATE KEY-----',
			} as Parameters<typeof unifiedFlowLoggerService.sanitizeCredentials>[0];
			const sanitized = unifiedFlowLoggerService.sanitizeCredentials(creds);
			expect((sanitized as { privateKey?: string })?.privateKey).toBe('[REDACTED]');
		});

		it('returns undefined for empty credentials', () => {
			expect(unifiedFlowLoggerService.sanitizeCredentials(undefined)).toBeUndefined();
		});
	});

	describe('log history', () => {
		it('adds entries to log history', () => {
			unifiedFlowLoggerService.setMinimumLogLevel('debug');
			unifiedFlowLoggerService.debug('test message', { flowType: 'oauth-authz' });
			const history = unifiedFlowLoggerService.getLogHistory();
			expect(history.length).toBeGreaterThanOrEqual(1);
			expect(history[history.length - 1].message).toBe('test message');
			expect(history[history.length - 1].context.flowType).toBe('oauth-authz');
		});

		it('clearHistory empties history and metrics', () => {
			unifiedFlowLoggerService.setMinimumLogLevel('debug');
			unifiedFlowLoggerService.debug('test');
			unifiedFlowLoggerService.clearHistory();
			expect(unifiedFlowLoggerService.getLogHistory().length).toBe(0);
			expect(unifiedFlowLoggerService.getPerformanceMetrics().length).toBe(0);
		});
	});

	describe('formatMessage', () => {
		it('includes flow context in formatted message', () => {
			const msg = unifiedFlowLoggerService.formatMessage('info', 'hello', {
				flowType: 'oauth-authz',
				specVersion: 'oidc',
				step: 0,
			});
			expect(msg).toContain('oauth-authz');
			expect(msg).toContain('oidc');
			expect(msg).toContain('Step 0');
			expect(msg).toContain('hello');
		});
	});

	describe('exportLogs', () => {
		it('returns valid JSON string', () => {
			unifiedFlowLoggerService.setMinimumLogLevel('debug');
			unifiedFlowLoggerService.debug('export test');
			const exported = unifiedFlowLoggerService.exportLogs();
			const parsed = JSON.parse(exported);
			expect(parsed).toHaveProperty('history');
			expect(parsed).toHaveProperty('performance');
			expect(parsed).toHaveProperty('exportedAt');
		});
	});
});
