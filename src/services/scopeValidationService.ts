// src/services/scopeValidationService.ts
// Centralized service for OAuth/OIDC scope validation and normalization

import {
	getDefaultScopesForFlow,
	getFlowScopeMapping,
	requiresOpenIdScope,
	validateScopesForFlow,
} from './flowScopeMappingService';

export interface ScopeValidationResult {
	isValid: boolean;
	normalizedScopes: string;
	scopeArray: string[];
	warnings: string[];
	errors: string[];
	processingTimeMs?: number;
	cacheHit?: boolean;
}

export interface ScopeConfig {
	flowType: 'oauth' | 'oidc' | 'device' | 'client-credentials' | 'implicit' | 'hybrid';
	allowEmpty?: boolean;
	requireOpenId?: boolean;
	customDefaults?: string[];
}

export interface ValidationMetrics {
	totalValidations: number;
	averageProcessingTime: number;
	errorRate: number;
	cacheHitRate: number;
	lastResetTime: number;
}

export interface ValidationCacheEntry {
	result: ScopeValidationResult;
	timestamp: number;
	ttl: number;
}

class ScopeValidationService {
	private static instance: ScopeValidationService;
	private validationCache = new Map<string, ValidationCacheEntry>();
	private validationMetrics: ValidationMetrics = {
		totalValidations: 0,
		averageProcessingTime: 0,
		errorRate: 0,
		cacheHitRate: 0,
		lastResetTime: Date.now(),
	};
	private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
	private readonly MAX_CACHE_SIZE = 100;

	static getInstance(): ScopeValidationService {
		if (!ScopeValidationService.instance) {
			ScopeValidationService.instance = new ScopeValidationService();
		}
		return ScopeValidationService.instance;
	}

	/**
	 * Default scopes for different flow types
	 * Now uses flowScopeMappingService for centralized mapping
	 */
	private getDefaultScopes(flowType: string): string {
		return getDefaultScopesForFlow(flowType);
	}

	/**
	 * Required scopes for different flow types
	 * Now uses flowScopeMappingService for centralized mapping
	 */
	private getRequiredScopes(flowType: string): string[] {
		const mapping = getFlowScopeMapping(flowType);
		return mapping.requiresOpenId ? ['openid'] : [];
	}

	/**
	 * Validate and normalize scopes for any OAuth/OIDC flow
	 */
	validateScopes(
		inputScopes: string | string[] | undefined | null,
		config: ScopeConfig
	): ScopeValidationResult {
		const startTime = performance.now();

		// Input validation
		if (!config) {
			throw new Error('SCOPE_VALIDATION_ERROR: Configuration is required');
		}

		if (!config.flowType) {
			throw new Error('SCOPE_VALIDATION_ERROR: flowType is required in configuration');
		}

		if (!this.isValidFlowType(config.flowType)) {
			throw new Error(`SCOPE_VALIDATION_ERROR: Invalid flowType: ${config.flowType}`);
		}

		// Check cache first
		const cacheKey = this.generateCacheKey(inputScopes, config);
		const cachedResult = this.getCachedResult(cacheKey);
		if (cachedResult) {
			this.updateMetrics(startTime, true, false);
			return { ...cachedResult, cacheHit: true };
		}

		const result: ScopeValidationResult = {
			isValid: true,
			normalizedScopes: '',
			scopeArray: [],
			warnings: [],
			errors: [],
		};

		try {
			// Handle different input types
			let rawScopes: string;

			if (Array.isArray(inputScopes)) {
				rawScopes = inputScopes.join(' ');
			} else if (typeof inputScopes === 'string') {
				rawScopes = inputScopes;
			} else {
				rawScopes = '';
			}

			// Clean and normalize the input
			rawScopes = rawScopes.trim();

			// If empty and not allowed, use defaults
			if (!rawScopes) {
				if (config.allowEmpty) {
					result.normalizedScopes = '';
					result.scopeArray = [];
					return result;
				} else {
					rawScopes = this.getDefaultScopes(config.flowType);
					result.warnings.push(`No scopes provided, using defaults: ${rawScopes}`);
				}
			}

			// Split into array and clean
			const scopeArray = rawScopes
				.split(/[\s,]+/) // Split on spaces or commas
				.map((scope) => scope.trim())
				.filter((scope) => scope.length > 0);

			// Remove duplicates while preserving order
			const uniqueScopes = Array.from(new Set(scopeArray));
			result.scopeArray = uniqueScopes;

			// Check for required scopes
			const requiredScopes = this.getRequiredScopes(config.flowType);
			const missingRequired = requiredScopes.filter((required) => !uniqueScopes.includes(required));

			if (missingRequired.length > 0) {
				// Always auto-add missing required scopes for authorization flows
				// This ensures openid is always included for PingOne authorization flows
				missingRequired.forEach((required) => {
					if (!uniqueScopes.includes(required)) {
						uniqueScopes.unshift(required);
						result.warnings.push(`Added required scope: ${required}`);
					}
				});
			}

			// Validate individual scopes
			const invalidScopes = uniqueScopes.filter((scope) => !this.isValidScope(scope));
			if (invalidScopes.length > 0) {
				result.errors.push(`SCOPE_VALIDATION_ERROR: Invalid scopes: ${invalidScopes.join(', ')}`);
				result.isValid = false;
			}

			// Check for common scope issues
			this.checkCommonIssues(uniqueScopes, config, result);

			// Final normalization
			result.normalizedScopes = uniqueScopes.join(' ');

			// Ensure we have at least one scope
			if (result.scopeArray.length === 0 && !config.allowEmpty) {
				result.errors.push('SCOPE_VALIDATION_ERROR: At least one scope must be specified');
				result.isValid = false;
			}
		} catch (error) {
			result.errors.push(
				`SCOPE_VALIDATION_ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
			result.isValid = false;
		}

		// Calculate processing time
		const processingTime = performance.now() - startTime;
		result.processingTimeMs = Math.round(processingTime * 100) / 100; // Round to 2 decimal places

		// Cache the result
		this.setCachedResult(cacheKey, result);

		// Update metrics
		this.updateMetrics(startTime, false, !result.isValid);

		return result;
	}

	/**
	 * Check if a single scope is valid
	 */
	private isValidScope(scope: string): boolean {
		// Basic scope validation rules
		if (!scope || scope.length === 0) return false;
		if (scope.length > 100) return false; // Reasonable limit

		// Allow alphanumeric, dots, colons, underscores, hyphens
		const scopeRegex = /^[a-zA-Z0-9._:-]+$/;
		return scopeRegex.test(scope);
	}

	/**
	 * Validate flow type
	 */
	private isValidFlowType(flowType: string): flowType is ScopeConfig['flowType'] {
		const validFlowTypes: ScopeConfig['flowType'][] = [
			'oauth',
			'oidc',
			'device',
			'client-credentials',
			'implicit',
			'hybrid',
		];
		return validFlowTypes.includes(flowType as ScopeConfig['flowType']);
	}

	/**
	 * Generate cache key for validation result
	 */
	private generateCacheKey(
		inputScopes: string | string[] | undefined | null,
		config: ScopeConfig
	): string {
		const scopeString = Array.isArray(inputScopes) ? inputScopes.join(' ') : inputScopes || '';
		const configString = JSON.stringify({
			flowType: config.flowType,
			allowEmpty: config.allowEmpty,
			requireOpenId: config.requireOpenId,
		});
		return `${scopeString}|${configString}`;
	}

	/**
	 * Get cached validation result
	 */
	private getCachedResult(cacheKey: string): ScopeValidationResult | null {
		const entry = this.validationCache.get(cacheKey);
		if (!entry) return null;

		// Check if cache entry is still valid
		if (Date.now() - entry.timestamp > entry.ttl) {
			this.validationCache.delete(cacheKey);
			return null;
		}

		return entry.result;
	}

	/**
	 * Set cached validation result
	 */
	private setCachedResult(cacheKey: string, result: ScopeValidationResult): void {
		// Clean up cache if it's getting too large
		if (this.validationCache.size >= this.MAX_CACHE_SIZE) {
			this.cleanupCache();
		}

		this.validationCache.set(cacheKey, {
			result: { ...result }, // Deep copy to prevent mutations
			timestamp: Date.now(),
			ttl: this.CACHE_TTL_MS,
		});
	}

	/**
	 * Clean up expired cache entries
	 */
	private cleanupCache(): void {
		const now = Date.now();
		for (const [key, entry] of this.validationCache.entries()) {
			if (now - entry.timestamp > entry.ttl) {
				this.validationCache.delete(key);
			}
		}
	}

	/**
	 * Update validation metrics
	 */
	private updateMetrics(startTime: number, cacheHit: boolean, hasError: boolean): void {
		const processingTime = performance.now() - startTime;

		this.validationMetrics.totalValidations++;

		// Update average processing time
		const totalTime =
			this.validationMetrics.averageProcessingTime * (this.validationMetrics.totalValidations - 1);
		this.validationMetrics.averageProcessingTime =
			(totalTime + processingTime) / this.validationMetrics.totalValidations;

		// Update error rate
		const totalErrors =
			this.validationMetrics.errorRate * (this.validationMetrics.totalValidations - 1);
		this.validationMetrics.errorRate =
			(totalErrors + (hasError ? 1 : 0)) / this.validationMetrics.totalValidations;

		// Update cache hit rate
		const totalCacheHits =
			this.validationMetrics.cacheHitRate * (this.validationMetrics.totalValidations - 1);
		this.validationMetrics.cacheHitRate =
			(totalCacheHits + (cacheHit ? 1 : 0)) / this.validationMetrics.totalValidations;
	}

	/**
	 * Check for common scope issues and add warnings
	 */
	private checkCommonIssues(
		scopes: string[],
		config: ScopeConfig,
		result: ScopeValidationResult
	): void {
		// Check for duplicate scopes (already handled above, but good to mention)
		if (scopes.length !== new Set(scopes).size) {
			result.warnings.push('Duplicate scopes were removed');
		}

		// Check for OIDC-specific scope issues
		if (
			config.flowType === 'oidc' ||
			config.flowType === 'implicit' ||
			config.flowType === 'hybrid'
		) {
			// openid scope is already required and auto-added above
			// Just provide informational warnings about additional scopes
			const hasProfile = scopes.includes('profile');
			const hasEmail = scopes.includes('email');

			if (!hasProfile && !hasEmail) {
				result.warnings.push(
					'Consider adding "profile" or "email" scopes for additional user information'
				);
			}
		}

		// Check for PingOne-specific scopes
		const pingOneScopes = scopes.filter((scope) => scope.startsWith('p1:'));
		if (pingOneScopes.length > 0) {
			result.warnings.push(`Using PingOne-specific scopes: ${pingOneScopes.join(', ')}`);
		}

		// Check for potentially problematic scopes
		const problematicScopes = scopes.filter(
			(scope) => scope.includes(' ') || scope.includes(',') || scope.includes(';')
		);
		if (problematicScopes.length > 0) {
			result.warnings.push(
				`Scopes with special characters detected: ${problematicScopes.join(', ')}`
			);
		}
	}

	/**
	 * Get recommended scopes for a flow type
	 */
	getRecommendedScopes(flowType: string): string[] {
		switch (flowType) {
			case 'oidc':
				return ['openid'];
			case 'oauth':
				return ['openid'];
			case 'device':
				return ['openid'];
			case 'client-credentials':
				return ['p1:read:user', 'p1:update:user'];
			case 'implicit':
				return ['openid'];
			case 'hybrid':
				return ['openid'];
			default:
				return ['openid'];
		}
	}

	/**
	 * Format scopes for display
	 */
	formatScopesForDisplay(scopes: string | string[]): string {
		const scopeArray = Array.isArray(scopes) ? scopes : scopes.split(/\s+/);
		return scopeArray.join(' ');
	}

	/**
	 * Parse scopes from various input formats
	 */
	parseScopes(input: string | string[] | undefined | null): string[] {
		if (!input) return [];

		if (Array.isArray(input)) {
			return input.filter((s) => s && s.trim().length > 0);
		}

		return input
			.split(/[\s,;]+/)
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
	}

	/**
	 * Merge scopes from multiple sources
	 */
	mergeScopes(...scopeSources: (string | string[] | undefined | null)[]): string {
		const allScopes = new Set<string>();

		scopeSources.forEach((source) => {
			const parsed = this.parseScopes(source);
			parsed.forEach((scope) => allScopes.add(scope));
		});

		return Array.from(allScopes).join(' ');
	}

	/**
	 * Validate scopes for authorization URL generation
	 * Now uses flowScopeMappingService for flow-aware validation
	 */
	validateForAuthorizationUrl(
		scopes: string | string[] | undefined | null,
		flowType: string
	): { scopes: string; isValid: boolean; error?: string } {
		// Use flowScopeMappingService for flow-aware validation
		const mappingValidation = validateScopesForFlow(flowType, scopes || '');

		if (!mappingValidation.isValid) {
			return {
				scopes: '',
				isValid: false,
				error: mappingValidation.errors.join('; '),
			};
		}

		// Also run through the existing validation for additional checks
		const config: ScopeConfig = {
			flowType: flowType as ScopeConfig['flowType'],
			allowEmpty: false,
			requireOpenId: requiresOpenIdScope(flowType),
		};

		const result = this.validateScopes(mappingValidation.normalizedScopes.join(' '), config);

		if (!result.isValid) {
			return {
				scopes: mappingValidation.normalizedScopes.join(' '),
				isValid: false,
				error: result.errors.join('; '),
			};
		}

		return {
			scopes: result.normalizedScopes,
			isValid: true,
		};
	}

	/**
	 * Get scope validation summary for debugging
	 */
	getValidationSummary(
		scopes: string | string[] | undefined | null,
		flowType: string
	): {
		input: string;
		normalized: string;
		isValid: boolean;
		warnings: string[];
		errors: string[];
		recommendations: string[];
	} {
		const config: ScopeConfig = {
			flowType: flowType as ScopeConfig['flowType'],
			allowEmpty: false,
			requireOpenId: true,
		};

		const result = this.validateScopes(scopes, config);
		const recommendations = this.getRecommendedScopes(flowType);

		return {
			input: Array.isArray(scopes) ? scopes.join(' ') : scopes || '',
			normalized: result.normalizedScopes,
			isValid: result.isValid,
			warnings: result.warnings,
			errors: result.errors,
			recommendations,
		};
	}

	/**
	 * Get current validation metrics
	 */
	getMetrics(): ValidationMetrics {
		return { ...this.validationMetrics };
	}

	/**
	 * Reset validation metrics
	 */
	resetMetrics(): void {
		this.validationMetrics = {
			totalValidations: 0,
			averageProcessingTime: 0,
			errorRate: 0,
			cacheHitRate: 0,
			lastResetTime: Date.now(),
		};
	}

	/**
	 * Clear validation cache
	 */
	clearCache(): void {
		this.validationCache.clear();
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { size: number; maxSize: number; ttlMs: number } {
		return {
			size: this.validationCache.size,
			maxSize: this.MAX_CACHE_SIZE,
			ttlMs: this.CACHE_TTL_MS,
		};
	}

	/**
	 * Force cache cleanup (public method)
	 */
	forceCleanupCache(): void {
		this.validationCache.clear();
		this.validationMetrics.cacheHitRate = 0;
		this.validationMetrics.lastResetTime = Date.now();
	}
}

// Export singleton instance
export const scopeValidationService = ScopeValidationService.getInstance();

// Export class for testing
export { ScopeValidationService };

// Global access for debugging
if (typeof window !== 'undefined') {
	(window as any).scopeValidationService = scopeValidationService;

	// Convenience functions
	(window as any).validateScopes = (scopes: string, flowType: string) =>
		scopeValidationService.validateForAuthorizationUrl(scopes, flowType);
	(window as any).getScopeSummary = (scopes: string, flowType: string) =>
		scopeValidationService.getValidationSummary(scopes, flowType);
	(window as any).getRecommendedScopes = (flowType: string) =>
		scopeValidationService.getRecommendedScopes(flowType);
	(window as any).getScopeMetrics = () => scopeValidationService.getMetrics();
	(window as any).getScopeCacheStats = () => scopeValidationService.getCacheStats();
	(window as any).clearScopeCache = () => scopeValidationService.clearCache();
	(window as any).resetScopeMetrics = () => scopeValidationService.resetMetrics();

}
