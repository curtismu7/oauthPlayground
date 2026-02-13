/**
 * @file riskPolicies.config.ts
 * @module protect-portal/config
 * @description Risk policy configuration for Protect Portal
 * @version 9.6.5
 * @since 2026-02-10
 *
 * This file contains configurable risk thresholds and policies
 * for the Protect Portal risk evaluation system.
 */

import type { RiskThresholds } from '../../pages/protect-portal/types/protectPortal.types';

// ============================================================================
// DEFAULT RISK POLICIES
// ============================================================================

/**
 * Default risk thresholds for Protect Portal
 * These can be overridden by environment-specific configurations
 */
export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = {
	low: {
		maxScore: 30,
		action: 'ALLOW',
	},
	medium: {
		minScore: 31,
		maxScore: 70,
		action: 'CHALLENGE_MFA',
	},
	high: {
		minScore: 71,
		action: 'BLOCK',
	},
};

// ============================================================================
// ENVIRONMENT-SPECIFIC CONFIGURATIONS
// ============================================================================

/**
 * Development environment risk policies (more lenient for testing)
 */
export const DEVELOPMENT_RISK_THRESHOLDS: RiskThresholds = {
	low: {
		maxScore: 40,
		action: 'ALLOW',
	},
	medium: {
		minScore: 41,
		maxScore: 80,
		action: 'CHALLENGE_MFA',
	},
	high: {
		minScore: 81,
		action: 'BLOCK',
	},
};

/**
 * Production environment risk policies (standard security)
 */
export const PRODUCTION_RISK_THRESHOLDS: RiskThresholds = {
	low: {
		maxScore: 25,
		action: 'ALLOW',
	},
	medium: {
		minScore: 26,
		maxScore: 65,
		action: 'CHALLENGE_MFA',
	},
	high: {
		minScore: 66,
		action: 'BLOCK',
	},
};

/**
 * High-security environment risk policies (most restrictive)
 */
export const HIGH_SECURITY_RISK_THRESHOLDS: RiskThresholds = {
	low: {
		maxScore: 15,
		action: 'ALLOW',
	},
	medium: {
		minScore: 16,
		maxScore: 45,
		action: 'CHALLENGE_MFA',
	},
	high: {
		minScore: 46,
		action: 'BLOCK',
	},
};

// ============================================================================
// CONFIGURATION SELECTION
// ============================================================================

/**
 * Get risk thresholds based on current environment
 */
export function getRiskThresholds(environment?: string): RiskThresholds {
	const env = environment || process.env.NODE_ENV || 'development';

	switch (env.toLowerCase()) {
		case 'production':
		case 'prod':
			return PRODUCTION_RISK_THRESHOLDS;

		case 'high-security':
		case 'secure':
		case 'restricted':
			return HIGH_SECURITY_RISK_THRESHOLDS;
		default:
			return DEVELOPMENT_RISK_THRESHOLDS;
	}
}

/**
 * Get custom risk thresholds from environment variables
 * Allows runtime configuration without code changes
 */
export function getEnvironmentRiskThresholds(): RiskThresholds | null {
	const env = process.env;

	// Check if custom thresholds are configured
	if (!env.RISK_LOW_MAX && !env.RISK_MEDIUM_MIN && !env.RISK_MEDIUM_MAX && !env.RISK_HIGH_MIN) {
		return null;
	}

	return {
		low: {
			maxScore: parseInt(env.RISK_LOW_MAX || '30', 10),
			action: 'ALLOW',
		},
		medium: {
			minScore: parseInt(env.RISK_MEDIUM_MIN || '31', 10),
			maxScore: parseInt(env.RISK_MEDIUM_MAX || '70', 10),
			action: 'CHALLENGE_MFA',
		},
		high: {
			minScore: parseInt(env.RISK_HIGH_MIN || '71', 10),
			action: 'BLOCK',
		},
	};
}

/**
 * Get the active risk thresholds with priority:
 * 1. Environment variables (highest priority)
 * 2. Environment-specific configuration
 * 3. Default configuration (fallback)
 */
export function getActiveRiskThresholds(environment?: string): RiskThresholds {
	// Try environment variables first
	const envThresholds = getEnvironmentRiskThresholds();
	if (envThresholds) {
		console.log('[🔧 RISK-CONFIG] Using environment variable thresholds');
		return envThresholds;
	}

	// Fall back to environment-specific configuration
	const configThresholds = getRiskThresholds(environment);
	console.log(`[🔧 RISK-CONFIG] Using ${environment || 'default'} environment thresholds`);
	return configThresholds;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate risk thresholds configuration
 */
export function validateRiskThresholds(thresholds: RiskThresholds): boolean {
	try {
		// Check basic structure
		if (!thresholds.low || !thresholds.medium || !thresholds.high) {
			return false;
		}

		// Check score ranges
		if (thresholds.low.maxScore < 0 || thresholds.low.maxScore > 100) {
			return false;
		}

		if (thresholds.medium.minScore <= thresholds.low.maxScore) {
			return false;
		}

		if (thresholds.medium.maxScore <= thresholds.medium.minScore) {
			return false;
		}

		if (thresholds.high.minScore <= thresholds.medium.maxScore) {
			return false;
		}

		if (thresholds.high.minScore > 100) {
			return false;
		}

		// Check actions
		if (thresholds.low.action !== 'ALLOW') {
			return false;
		}

		if (thresholds.medium.action !== 'CHALLENGE_MFA') {
			return false;
		}

		if (thresholds.high.action !== 'BLOCK') {
			return false;
		}

		return true;
	} catch (error) {
		console.error('[🔧 RISK-CONFIG] Threshold validation failed:', error);
		return false;
	}
}

// ============================================================================
// EXPORTS
// ============================================================================

export const RISK_POLICY_CONFIG = {
	DEFAULT_RISK_THRESHOLDS,
	DEVELOPMENT_RISK_THRESHOLDS,
	PRODUCTION_RISK_THRESHOLDS,
	HIGH_SECURITY_RISK_THRESHOLDS,
	getRiskThresholds,
	getEnvironmentRiskThresholds,
	getActiveRiskThresholds,
	validateRiskThresholds,
};
