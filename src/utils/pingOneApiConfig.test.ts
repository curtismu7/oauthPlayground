/**
 * Tests for PingOne API config: proxy vs direct by host (localhost vs custom domain).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	getPingOneAuthBaseUrl,
	getPingOnePlatformBaseUrl,
	shouldUsePingOneProxy,
} from './pingOneApiConfig';

const _originalWindow = globalThis.window;

describe('pingOneApiConfig', () => {
	/** Set hostname for tests (simulate location). */
	function setHostname(hostname: string) {
		Object.defineProperty(window, 'location', {
			value: { ...window.location, hostname },
			writable: true,
			configurable: true,
		});
	}

	afterEach(() => {
		vi.restoreAllMocks();
		// Restore a sane default for other tests
		setHostname('localhost');
	});

	describe('shouldUsePingOneProxy', () => {
		it('returns true for localhost (use proxy)', () => {
			setHostname('localhost');
			expect(shouldUsePingOneProxy()).toBe(true);
		});

		it('returns true for 127.0.0.1 (use proxy)', () => {
			setHostname('127.0.0.1');
			expect(shouldUsePingOneProxy()).toBe(true);
		});

		it('returns false for custom domain api.pingdemo.com (call direct)', () => {
			setHostname('api.pingdemo.com');
			expect(shouldUsePingOneProxy()).toBe(false);
		});

		it('returns false for other custom hostnames', () => {
			setHostname('app.example.com');
			expect(shouldUsePingOneProxy()).toBe(false);
		});

		it('is case-insensitive for localhost', () => {
			setHostname('LOCALHOST');
			expect(shouldUsePingOneProxy()).toBe(true);
		});
	});

	describe('getPingOnePlatformBaseUrl', () => {
		it('returns empty string when on localhost (use proxy)', () => {
			setHostname('localhost');
			expect(getPingOnePlatformBaseUrl('us')).toBe('');
			expect(getPingOnePlatformBaseUrl()).toBe('');
		});

		it('returns empty string when on 127.0.0.1 (use proxy)', () => {
			setHostname('127.0.0.1');
			expect(getPingOnePlatformBaseUrl('us')).toBe('');
		});

		it('returns Platform base URL when on custom domain', () => {
			setHostname('api.pingdemo.com');
			expect(getPingOnePlatformBaseUrl('us')).toBe('https://api.pingone.com');
			expect(getPingOnePlatformBaseUrl('na')).toBe('https://api.pingone.com');
		});

		it('returns correct regional Platform URLs for custom domain', () => {
			setHostname('api.pingdemo.com');
			expect(getPingOnePlatformBaseUrl('eu')).toBe('https://api.pingone.eu');
			expect(getPingOnePlatformBaseUrl('ca')).toBe('https://api.pingone.ca');
			expect(getPingOnePlatformBaseUrl('ap')).toBe('https://api.pingone.asia');
			expect(getPingOnePlatformBaseUrl('asia')).toBe('https://api.pingone.asia');
		});
	});

	describe('getPingOneAuthBaseUrl', () => {
		it('returns empty string when on localhost (use proxy)', () => {
			setHostname('localhost');
			expect(getPingOneAuthBaseUrl('us')).toBe('');
		});

		it('returns Auth base URL when on custom domain', () => {
			setHostname('api.pingdemo.com');
			expect(getPingOneAuthBaseUrl('us')).toBe('https://auth.pingone.com');
		});

		it('returns correct regional Auth URLs for custom domain', () => {
			setHostname('api.pingdemo.com');
			expect(getPingOneAuthBaseUrl('eu')).toBe('https://auth.pingone.eu');
			expect(getPingOneAuthBaseUrl('ca')).toBe('https://auth.pingone.ca');
			expect(getPingOneAuthBaseUrl('ap')).toBe('https://auth.pingone.asia');
		});
	});

	describe('proxy vs direct behavior', () => {
		it('localhost: proxy mode (empty base URLs)', () => {
			setHostname('localhost');
			expect(shouldUsePingOneProxy()).toBe(true);
			expect(getPingOnePlatformBaseUrl('us')).toBe('');
			expect(getPingOneAuthBaseUrl('us')).toBe('');
		});

		it('custom domain: direct mode (non-empty base URLs)', () => {
			setHostname('api.pingdemo.com');
			expect(shouldUsePingOneProxy()).toBe(false);
			expect(getPingOnePlatformBaseUrl('us')).toBe('https://api.pingone.com');
			expect(getPingOneAuthBaseUrl('us')).toBe('https://auth.pingone.com');
		});
	});
});
