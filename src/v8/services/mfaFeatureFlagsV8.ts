/**
 * @file mfaFeatureFlagsV8.ts
 * @module v8/services
 * @description Simple feature flag service for MFA consolidation migration
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Enable gradual rollout of unified MFA flow (10% → 50% → 100%)
 * Strategy: Uses localStorage for flag state with deterministic user bucketing
 *
 * @example
 * // Check if unified SMS flow is enabled for current user
 * if (MFAFeatureFlagsV8.isEnabled('mfa_unified_sms')) {
 *   return <UnifiedMFARegistrationFlowV8 deviceType="SMS" />;
 * } else {
 *   return <SMSOTPConfigurationPageV8 />;
 * }
 *
 * @example
 * // Admin: Enable SMS at 10% rollout (in browser console)
 * window.mfaFlags.setFlag('mfa_unified_sms', true, 10);
 *
 * @example
 * // Admin: Instant rollback to old flow
 * window.mfaFlags.setFlag('mfa_unified_sms', false, 0);
 */

export type MFAFeatureFlag =
	| 'mfa_unified_sms'
	| 'mfa_unified_email'
	| 'mfa_unified_mobile'
	| 'mfa_unified_whatsapp'
	| 'mfa_unified_totp'
	| 'mfa_unified_fido2';

export type RolloutPercentage = 0 | 10 | 50 | 100;

interface FeatureFlagState {
	enabled: boolean;
	rolloutPercentage: RolloutPercentage;
	lastUpdated: number;
}

const DEFAULT_FLAGS: Record<MFAFeatureFlag, FeatureFlagState> = {
	mfa_unified_sms: { enabled: false, rolloutPercentage: 0, lastUpdated: Date.now() },
	mfa_unified_email: { enabled: false, rolloutPercentage: 0, lastUpdated: Date.now() },
	mfa_unified_mobile: { enabled: false, rolloutPercentage: 0, lastUpdated: Date.now() },
	mfa_unified_whatsapp: { enabled: false, rolloutPercentage: 0, lastUpdated: Date.now() },
	mfa_unified_totp: { enabled: false, rolloutPercentage: 0, lastUpdated: Date.now() },
	mfa_unified_fido2: { enabled: false, rolloutPercentage: 0, lastUpdated: Date.now() },
};

/**
 * Simple feature flag service for MFA consolidation migration
 *
 * Features:
 * - Percentage-based rollout (0%, 10%, 50%, 100%)
 * - Deterministic user bucketing (same user always gets same experience)
 * - localStorage persistence (survives page reloads)
 * - Instant rollback capability (change percentage to 0%)
 * - Browser console admin UI (window.mfaFlags)
 */
export class MFAFeatureFlagsV8 {
	private static readonly STORAGE_KEY = 'mfa_feature_flags_v8';

	/**
	 * Check if a feature flag is enabled for the current user
	 *
	 * Uses deterministic user ID hashing for consistent A/B splits.
	 * Same user will always get same result for a given percentage.
	 *
	 * @param flag - The feature flag to check
	 * @returns true if flag is enabled for this user, false otherwise
	 */
	static isEnabled(flag: MFAFeatureFlag): boolean {
		const state = MFAFeatureFlagsV8.getFlagState(flag);

		// If flag is disabled, always return false
		if (!state.enabled) return false;

		// If 100% rollout, always enabled
		if (state.rolloutPercentage === 100) return true;

		// If 0% rollout, always disabled
		if (state.rolloutPercentage === 0) return false;

		// Percentage-based rollout using deterministic user ID hash
		// Same user always gets same result (consistent experience)
		const userId = MFAFeatureFlagsV8.getUserId();
		const hash = MFAFeatureFlagsV8.hashString(userId + flag);
		const bucket = hash % 100;

		return bucket < state.rolloutPercentage;
	}

	/**
	 * Set flag state (admin/testing use only)
	 *
	 * @param flag - The feature flag to set
	 * @param enabled - Whether the flag is enabled
	 * @param rolloutPercentage - Percentage of users to enable for (0, 10, 50, or 100)
	 */
	static setFlag(
		flag: MFAFeatureFlag,
		enabled: boolean,
		rolloutPercentage: RolloutPercentage = 0
	): void {
		const flags = MFAFeatureFlagsV8.getAllFlags();
		flags[flag] = {
			enabled,
			rolloutPercentage,
			lastUpdated: Date.now(),
		};
		localStorage.setItem(MFAFeatureFlagsV8.STORAGE_KEY, JSON.stringify(flags));
		console.log(
			`[MFA-FLAGS] ${flag} set to ${enabled ? 'ENABLED' : 'DISABLED'} (${rolloutPercentage}% rollout)`
		);
	}

	/**
	 * Get current state of a flag
	 *
	 * @param flag - The feature flag to get state for
	 * @returns The current state of the flag
	 */
	static getFlagState(flag: MFAFeatureFlag): FeatureFlagState {
		const flags = MFAFeatureFlagsV8.getAllFlags();
		return flags[flag] || DEFAULT_FLAGS[flag];
	}

	/**
	 * Get all flags (for admin UI)
	 *
	 * @returns Record of all feature flags and their states
	 */
	static getAllFlags(): Record<MFAFeatureFlag, FeatureFlagState> {
		try {
			const stored = localStorage.getItem(MFAFeatureFlagsV8.STORAGE_KEY);
			if (!stored) return { ...DEFAULT_FLAGS };
			return { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
		} catch {
			return { ...DEFAULT_FLAGS };
		}
	}

	/**
	 * Reset all flags to default (testing use only)
	 */
	static resetAllFlags(): void {
		localStorage.removeItem(MFAFeatureFlagsV8.STORAGE_KEY);
		console.log('[MFA-FLAGS] All flags reset to defaults (all disabled)');
	}

	/**
	 * Get stable user ID for A/B testing
	 *
	 * Uses browser fingerprint if no user session.
	 * Same browser will always get same ID (consistent bucketing).
	 *
	 * @returns Stable user identifier string
	 */
	private static getUserId(): string {
		// Try to get from session/auth
		const storedUserId = sessionStorage.getItem('mfa_user_id');
		if (storedUserId) return storedUserId;

		// Generate stable browser fingerprint
		const fingerprint = [
			navigator.userAgent,
			navigator.language,
			new Date().getTimezoneOffset(),
			screen.width,
			screen.height,
		].join('|');

		return fingerprint;
	}

	/**
	 * Simple hash function for deterministic bucketing
	 *
	 * Converts string to consistent number for % calculation.
	 *
	 * @param str - String to hash
	 * @returns Positive integer hash
	 */
	private static hashString(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return Math.abs(hash);
	}

	/**
	 * Get human-readable summary of all flags (for admin UI)
	 *
	 * @returns Array of flag summaries
	 */
	static getFlagsSummary(): Array<{
		flag: MFAFeatureFlag;
		enabled: boolean;
		rolloutPercentage: RolloutPercentage;
		appliesTo: string;
	}> {
		const allFlags = MFAFeatureFlagsV8.getAllFlags();
		return Object.entries(allFlags).map(([flag, state]) => ({
			flag: flag as MFAFeatureFlag,
			enabled: state.enabled,
			rolloutPercentage: state.rolloutPercentage,
			appliesTo: MFAFeatureFlagsV8.isEnabled(flag as MFAFeatureFlag)
				? 'THIS USER'
				: 'not this user',
		}));
	}
}

// Admin UI helper - expose to browser console
if (typeof window !== 'undefined') {
	(window as any).mfaFlags = MFAFeatureFlagsV8;
	console.log(
		'[MFA-FLAGS] Admin helpers available at window.mfaFlags\n' +
			'Examples:\n' +
			'  window.mfaFlags.setFlag("mfa_unified_sms", true, 10)  // Enable SMS at 10%\n' +
			'  window.mfaFlags.isEnabled("mfa_unified_sms")          // Check status\n' +
			'  window.mfaFlags.getFlagsSummary()                     // View all flags\n' +
			'  window.mfaFlags.resetAllFlags()                       // Reset all to defaults'
	);
}
