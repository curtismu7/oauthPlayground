/**
 * @file mfaFeatureFlags.test.ts
 * @module v8/services/__tests__
 * @description Unit tests for MFA feature flag service
 * @version 8.0.0
 * @since 2026-01-29
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MFAFeatureFlags } from '../mfaFeatureFlags';

describe('MFAFeatureFlags', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
		MFAFeatureFlags.resetAllFlags();
	});

	afterEach(() => {
		MFAFeatureFlags.resetAllFlags();
	});

	describe('isEnabled', () => {
		it('should return false for disabled flags', () => {
			expect(MFAFeatureFlags.isEnabled('mfa_unified_sms')).toBe(false);
		});

		it('should return true for flags enabled at 100%', () => {
			MFAFeatureFlags.setFlag('mfa_unified_sms', true, 100);
			expect(MFAFeatureFlags.isEnabled('mfa_unified_sms')).toBe(true);
		});

		it('should return false for flags enabled at 0%', () => {
			MFAFeatureFlags.setFlag('mfa_unified_sms', true, 0);
			expect(MFAFeatureFlags.isEnabled('mfa_unified_sms')).toBe(false);
		});

		it('should deterministically bucket users for percentage rollouts', () => {
			MFAFeatureFlags.setFlag('mfa_unified_sms', true, 50);

			// Same user should get same result on multiple calls
			const result1 = MFAFeatureFlags.isEnabled('mfa_unified_sms');
			const result2 = MFAFeatureFlags.isEnabled('mfa_unified_sms');
			const result3 = MFAFeatureFlags.isEnabled('mfa_unified_sms');

			expect(result1).toBe(result2);
			expect(result2).toBe(result3);
		});
	});

	describe('setFlag', () => {
		it('should enable a flag', () => {
			MFAFeatureFlags.setFlag('mfa_unified_email', true, 100);
			expect(MFAFeatureFlags.isEnabled('mfa_unified_email')).toBe(true);
		});

		it('should disable a flag', () => {
			MFAFeatureFlags.setFlag('mfa_unified_email', true, 100);
			MFAFeatureFlags.setFlag('mfa_unified_email', false, 0);
			expect(MFAFeatureFlags.isEnabled('mfa_unified_email')).toBe(false);
		});

		it('should persist flags to localStorage', () => {
			MFAFeatureFlags.setFlag('mfa_unified_totp', true, 50);

			// Create new instance (simulates page reload)
			const state = MFAFeatureFlags.getFlagState('mfa_unified_totp');
			expect(state.enabled).toBe(true);
			expect(state.rolloutPercentage).toBe(50);
		});
	});

	describe('getFlagState', () => {
		it('should return default state for unconfigured flags', () => {
			const state = MFAFeatureFlags.getFlagState('mfa_unified_fido2');
			expect(state.enabled).toBe(false);
			expect(state.rolloutPercentage).toBe(0);
		});

		it('should return configured state', () => {
			MFAFeatureFlags.setFlag('mfa_unified_whatsapp', true, 10);
			const state = MFAFeatureFlags.getFlagState('mfa_unified_whatsapp');
			expect(state.enabled).toBe(true);
			expect(state.rolloutPercentage).toBe(10);
		});
	});

	describe('getAllFlags', () => {
		it('should return all flags with default states', () => {
			const flags = MFAFeatureFlags.getAllFlags();
			expect(Object.keys(flags)).toHaveLength(6);
			expect(flags.mfa_unified_sms).toBeDefined();
			expect(flags.mfa_unified_email).toBeDefined();
		});

		it('should include configured flags', () => {
			MFAFeatureFlags.setFlag('mfa_unified_sms', true, 100);
			MFAFeatureFlags.setFlag('mfa_unified_email', true, 50);

			const flags = MFAFeatureFlags.getAllFlags();
			expect(flags.mfa_unified_sms.enabled).toBe(true);
			expect(flags.mfa_unified_email.rolloutPercentage).toBe(50);
		});
	});

	describe('resetAllFlags', () => {
		it('should reset all flags to default', () => {
			MFAFeatureFlags.setFlag('mfa_unified_sms', true, 100);
			MFAFeatureFlags.setFlag('mfa_unified_email', true, 50);

			MFAFeatureFlags.resetAllFlags();

			expect(MFAFeatureFlags.isEnabled('mfa_unified_sms')).toBe(false);
			expect(MFAFeatureFlags.isEnabled('mfa_unified_email')).toBe(false);
		});
	});

	describe('getFlagsSummary', () => {
		it('should return summary of all flags', () => {
			MFAFeatureFlags.setFlag('mfa_unified_sms', true, 100);

			const summary = MFAFeatureFlags.getFlagsSummary();
			expect(summary).toHaveLength(6);
			expect(summary[0]).toHaveProperty('flag');
			expect(summary[0]).toHaveProperty('enabled');
			expect(summary[0]).toHaveProperty('rolloutPercentage');
			expect(summary[0]).toHaveProperty('appliesTo');
		});
	});
});
