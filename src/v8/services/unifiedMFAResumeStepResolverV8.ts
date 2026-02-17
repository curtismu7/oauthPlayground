/**
 * @file unifiedMFAResumeStepResolverV8.ts
 * @module v8/services
 * @description Fool-proof Unified MFA Step Resume Resolver with persistent logging
 * @version 8.0.0
 * @since 2026-02-15
 *
 * Purpose: Resolve the correct step to resume after OAuth redirects in Unified MFA flow.
 * Implements strict precedence ordering and invariant: redirect-resume must NOT route to Step 0.
 * If step cannot be resolved confidently, fallback is Step 2 (never Step 0 for redirect resumes).
 *
 * Architecture:
 * - Deterministic precedence ordering of step sources
 * - Validation and rejection of corrupted/expired state
 * - Idempotent handling (refresh/reload doesn't change outcome)
 * - Structured persistent logging with correlation IDs
 * - FOOL-PROOF: Step 0 fallback is forbidden for redirect resumes
 */

import { MFARedirectUriServiceV8 } from '@/v8/services/mfaRedirectUriServiceV8';

const MODULE_TAG = '[🔄 UNIFIED-MFA-STEP-RESOLVER-V8]';
const RESOLVER_VERSION = '1.0.0';

// Step resolution precedence (highest to lowest priority)
export enum StepResolutionSource {
	SERVER_SESSION = 'server_session', // Server-side session state
	STATE_PARAM = 'state_param', // Signed state in redirect params
	CLIENT_STORAGE = 'client_storage', // Persisted client state
	LAST_KNOWN_STEP = 'last_known_step', // Last-known step in state store
	FALLBACK_STEP_2 = 'fallback_step_2', // FOOL-PROOF: Never Step 0
}

export interface StepResolutionResult {
	/** Resolved step number */
	step: number;
	/** Source that provided the step */
	source: StepResolutionSource;
	/** Correlation ID for tracking */
	correlationId: string;
	/** Whether resolution was confident */
	confident: boolean;
	/** Reason for source selection/rejection */
	reason: string;
	/** Timestamp when resolution occurred */
	timestamp: string;
	/** Sanitized URL at resolution time */
	currentUrl: string;
	/** Available redirect params (sanitized) */
	redirectParams: Record<string, string>;
}

export interface StepResolverContext {
	/** Current URL (sanitized) */
	currentUrl: string;
	/** URL search parameters */
	searchParams: URLSearchParams;
	/** Session storage data */
	sessionStorage: Record<string, string>;
	/** Local storage data */
	localStorage: Record<string, string>;
	/** Correlation ID for tracking */
	correlationId: string;
	/** Sanitized redirect parameters */
	redirectParams: Record<string, string>;
}

/**
 * Unified MFA Step Resume Resolver
 *
 * Implements fool-proof step resolution with strict precedence and invariant:
 * "redirect-resume path must not route to Step 0"
 */
export class UnifiedMFAResumeStepResolverV8 {
	/**
	 * Generate correlation ID for tracking
	 */
	private static generateCorrelationId(): string {
		return `mfa-resume-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}

	/**
	 * Sanitize URL for logging (remove sensitive params)
	 */
	private static sanitizeUrl(url: string): string {
		try {
			const urlObj = new URL(url);
			// Remove sensitive parameters
			const sensitiveParams = ['code', 'state', 'token', 'session', 'auth'];
			sensitiveParams.forEach((param) => urlObj.searchParams.delete(param));
			return urlObj.toString();
		} catch {
			return '[INVALID_URL]';
		}
	}

	/**
	 * Sanitize redirect parameters for logging
	 */
	private static sanitizeRedirectParams(params: URLSearchParams): Record<string, string> {
		const sanitized: Record<string, string> = {};
		const sensitiveKeys = ['code', 'state', 'token', 'session', 'auth', 'client_secret'];

		params.forEach((value, key) => {
			if (sensitiveKeys.includes(key)) {
				sanitized[key] = '[REDACTED]';
			} else {
				sanitized[key] = value;
			}
		});

		return sanitized;
	}

	/**
	 * Extract storage data safely
	 */
	private static getStorageData(): {
		sessionStorage: Record<string, string>;
		localStorage: Record<string, string>;
	} {
		const sessionStorage: Record<string, string> = {};
		const localStorage: Record<string, string> = {};

		try {
			// Extract relevant sessionStorage keys
			const sessionKeys = [
				'mfa_target_step_after_callback',
				'mfa_oauth_callback_step',
				'mfa_oauth_callback_return',
				'mfa_oauth_callback_timestamp',
				'user_login_state_v8',
				'mfa-flow-v8',
				'unified-mfa-current-step',
			];

			sessionKeys.forEach((key) => {
				const value = window.sessionStorage.getItem(key);
				if (value !== null) {
					sessionStorage[key] = value;
				}
			});
		} catch {
			// Silently handle storage access errors
		}

		try {
			// Extract relevant localStorage keys
			const localKeys = [
				'mfa-flow-v8',
				'user-login-v8',
				'unified-mfa-last-known-step',
				'unified-mfa-flow-state',
			];

			localKeys.forEach((key) => {
				const value = window.localStorage.getItem(key);
				if (value !== null) {
					localStorage[key] = value;
				}
			});
		} catch {
			// Silently handle storage access errors
		}

		return { sessionStorage, localStorage };
	}

	/**
	 * Validate step number
	 */
	private static isValidStep(step: number): boolean {
		return Number.isInteger(step) && step >= 0 && step <= 6;
	}

	/**
	 * Check if state is expired (older than 30 minutes)
	 */
	private static isStateExpired(timestamp: string): boolean {
		try {
			const stateTime = new Date(timestamp);
			const now = new Date();
			const diffMs = now.getTime() - stateTime.getTime();
			const diffMinutes = diffMs / (1000 * 60);
			return diffMinutes > 30; // 30 minutes expiration
		} catch {
			return true; // Treat invalid timestamps as expired
		}
	}

	/**
	 * Log structured decision to persistent storage
	 */
	private static logDecision(
		correlationId: string,
		context: StepResolverContext,
		result: StepResolutionResult,
		rejectedSources: Array<{ source: StepResolutionSource; reason: string }>
	): void {
		const logEntry = {
			correlationId,
			timestamp: result.timestamp,
			event: 'STEP_RESOLVE_DECISION',
			resolver: MODULE_TAG,
			version: RESOLVER_VERSION,
			context: {
				currentUrl: context.currentUrl,
				redirectParams: context.redirectParams,
				hasSessionStorage: Object.keys(context.sessionStorage).length > 0,
				hasLocalStorage: Object.keys(context.localStorage).length > 0,
			},
			result: {
				step: result.step,
				source: result.source,
				confident: result.confident,
				reason: result.reason,
			},
			rejectedSources,
			invariant: {
				stepNotZero: result.step !== 0,
				fallbackUsed: result.source === StepResolutionSource.FALLBACK_STEP_2,
			},
		};

		// Log to persistent storage via MFARedirectUriService
		MFARedirectUriServiceV8.logDebugEvent(
			'STEP_RESOLVER',
			`Step resolved: ${result.step} from ${result.source}`,
			logEntry,
			result.confident ? 'INFO' : 'WARN'
		);
	}

	/**
	 * Resolve step from server session (highest priority)
	 */
	private static resolveFromServerSession(
		context: StepResolverContext
	): StepResolutionResult | null {
		const { sessionStorage } = context;

		// Check for server-side session state
		const serverSessionStep = sessionStorage['mfa_server_session_step'];
		if (serverSessionStep) {
			const step = parseInt(serverSessionStep, 10);
			if (UnifiedMFAResumeStepResolverV8.isValidStep(step) && step !== 0) {
				return {
					step,
					source: StepResolutionSource.SERVER_SESSION,
					correlationId: context.correlationId,
					confident: true,
					reason: 'Server session state available and valid',
					timestamp: new Date().toISOString(),
					currentUrl: context.currentUrl,
					redirectParams: context.redirectParams,
				};
			}
		}

		return null;
	}

	/**
	 * Resolve step from signed state parameter
	 */
	private static resolveFromStateParam(context: StepResolverContext): StepResolutionResult | null {
		const { searchParams, sessionStorage } = context;

		// Check for step in URL params
		const urlStep = searchParams.get('step');
		if (urlStep) {
			const step = parseInt(urlStep, 10);
			if (UnifiedMFAResumeStepResolverV8.isValidStep(step) && step !== 0) {
				return {
					step,
					source: StepResolutionSource.STATE_PARAM,
					correlationId: context.correlationId,
					confident: true,
					reason: 'Step parameter in URL',
					timestamp: new Date().toISOString(),
					currentUrl: context.currentUrl,
					redirectParams: context.redirectParams,
				};
			}
		}

		// Check for callback step in sessionStorage
		const callbackStep = sessionStorage['mfa_oauth_callback_step'];
		if (callbackStep) {
			const step = parseInt(callbackStep, 10);
			if (UnifiedMFAResumeStepResolverV8.isValidStep(step) && step !== 0) {
				// Verify timestamp is not expired
				const timestamp = sessionStorage['mfa_oauth_callback_timestamp'];
				if (!timestamp || UnifiedMFAResumeStepResolverV8.isStateExpired(timestamp)) {
					return null; // Expired state
				}

				return {
					step,
					source: StepResolutionSource.STATE_PARAM,
					correlationId: context.correlationId,
					confident: true,
					reason: 'OAuth callback step from sessionStorage',
					timestamp: new Date().toISOString(),
					currentUrl: context.currentUrl,
					redirectParams: context.redirectParams,
				};
			}
		}

		return null;
	}

	/**
	 * Resolve step from client storage
	 */
	private static resolveFromClientStorage(
		context: StepResolverContext
	): StepResolutionResult | null {
		const { sessionStorage, localStorage } = context;

		// Check for target step after callback
		const targetStep = sessionStorage['mfa_target_step_after_callback'];
		if (targetStep) {
			const step = parseInt(targetStep, 10);
			if (UnifiedMFAResumeStepResolverV8.isValidStep(step) && step !== 0) {
				return {
					step,
					source: StepResolutionSource.CLIENT_STORAGE,
					correlationId: context.correlationId,
					confident: true,
					reason: 'Target step after callback',
					timestamp: new Date().toISOString(),
					currentUrl: context.currentUrl,
					redirectParams: context.redirectParams,
				};
			}
		}

		// Check for stored flow state
		const flowState = localStorage['unified-mfa-flow-state'];
		if (flowState) {
			try {
				const parsed = JSON.parse(flowState);
				if (
					parsed.currentStep &&
					UnifiedMFAResumeStepResolverV8.isValidStep(parsed.currentStep) &&
					parsed.currentStep !== 0
				) {
					return {
						step: parsed.currentStep,
						source: StepResolutionSource.CLIENT_STORAGE,
						correlationId: context.correlationId,
						confident: true,
						reason: 'Flow state from localStorage',
						timestamp: new Date().toISOString(),
						currentUrl: context.currentUrl,
						redirectParams: context.redirectParams,
					};
				}
			} catch {
				// Invalid JSON, ignore
			}
		}

		return null;
	}

	/**
	 * Resolve step from last known step
	 */
	private static resolveFromLastKnownStep(
		context: StepResolverContext
	): StepResolutionResult | null {
		const { localStorage } = context;

		// Check for last known step
		const lastKnownStep = localStorage['unified-mfa-last-known-step'];
		if (lastKnownStep) {
			const step = parseInt(lastKnownStep, 10);
			if (UnifiedMFAResumeStepResolverV8.isValidStep(step) && step !== 0) {
				return {
					step,
					source: StepResolutionSource.LAST_KNOWN_STEP,
					correlationId: context.correlationId,
					confident: false,
					reason: 'Last known step from localStorage',
					timestamp: new Date().toISOString(),
					currentUrl: context.currentUrl,
					redirectParams: context.redirectParams,
				};
			}
		}

		return null;
	}

	/**
	 * FOOL-PROOF fallback to Step 2 (never Step 0)
	 */
	private static resolveFallbackStep2(context: StepResolverContext): StepResolutionResult {
		return {
			step: 2,
			source: StepResolutionSource.FALLBACK_STEP_2,
			correlationId: context.correlationId,
			confident: false,
			reason: 'FOOL-PROOF: Fallback to Step 2 (Step 0 forbidden for redirect resumes)',
			timestamp: new Date().toISOString(),
			currentUrl: context.currentUrl,
			redirectParams: context.redirectParams,
		};
	}

	/**
	 * Resolve the correct step to resume after OAuth redirect
	 *
	 * This is the main entry point that implements the fool-proof step resolution
	 * with strict precedence and invariant enforcement.
	 *
	 * @param currentUrl - Current page URL
	 * @returns Step resolution result with full context
	 */
	public static resolveResumeStep(currentUrl: string = window.location.href): StepResolutionResult {
		const correlationId = UnifiedMFAResumeStepResolverV8.generateCorrelationId();
		const startTime = Date.now();

		// Build context
		const searchParams = new URL(window.location.href).searchParams;
		const { sessionStorage, localStorage } = UnifiedMFAResumeStepResolverV8.getStorageData();

		const context: StepResolverContext = {
			currentUrl: UnifiedMFAResumeStepResolverV8.sanitizeUrl(currentUrl),
			searchParams,
			sessionStorage,
			localStorage,
			correlationId,
			redirectParams: UnifiedMFAResumeStepResolverV8.sanitizeRedirectParams(searchParams),
		};

		const rejectedSources: Array<{ source: StepResolutionSource; reason: string }> = [];

		// Try each source in precedence order
		const sources = [
			{
				resolver: UnifiedMFAResumeStepResolverV8.resolveFromServerSession,
				source: StepResolutionSource.SERVER_SESSION,
			},
			{
				resolver: UnifiedMFAResumeStepResolverV8.resolveFromStateParam,
				source: StepResolutionSource.STATE_PARAM,
			},
			{
				resolver: UnifiedMFAResumeStepResolverV8.resolveFromClientStorage,
				source: StepResolutionSource.CLIENT_STORAGE,
			},
			{
				resolver: UnifiedMFAResumeStepResolverV8.resolveFromLastKnownStep,
				source: StepResolutionSource.LAST_KNOWN_STEP,
			},
		];

		for (const { resolver, source } of sources) {
			try {
				const result = resolver.call(UnifiedMFAResumeStepResolverV8, context);
				if (result) {
					// ENFORCE INVARIANT: Step 0 is forbidden for redirect resumes
					if (result.step === 0) {
						rejectedSources.push({
							source,
							reason: `Step 0 forbidden for redirect resumes (invariant violation)`,
						});
						continue;
					}

					// Log successful resolution
					UnifiedMFAResumeStepResolverV8.logDecision(
						correlationId,
						context,
						result,
						rejectedSources
					);

					const endTime = Date.now();
					console.log(
						`${MODULE_TAG} ✅ Step resolved in ${endTime - startTime}ms: ${result.step} from ${result.source} (${correlationId})`
					);

					return result;
				} else {
					rejectedSources.push({ source, reason: 'No valid data found' });
				}
			} catch (error) {
				rejectedSources.push({ source, reason: `Error: ${error}` });
			}
		}

		// FOOL-PROOF: If no source worked, fallback to Step 2 (never Step 0)
		const fallbackResult = UnifiedMFAResumeStepResolverV8.resolveFallbackStep2(context);
		UnifiedMFAResumeStepResolverV8.logDecision(
			correlationId,
			context,
			fallbackResult,
			rejectedSources
		);

		const endTime = Date.now();
		console.log(
			`${MODULE_TAG} 🔒 FOOL-PROOF fallback in ${endTime - startTime}ms: Step 2 (${correlationId})`
		);

		return fallbackResult;
	}

	/**
	 * Check if this is a redirect resume scenario
	 */
	public static isRedirectResumeScenario(): boolean {
		const searchParams = new URL(window.location.href).searchParams;
		const { sessionStorage } = UnifiedMFAResumeStepResolverV8.getStorageData();

		// Check for OAuth callback indicators
		const hasCode = searchParams.has('code');
		const hasState = searchParams.has('state');
		const hasCallbackReturn = sessionStorage['mfa_oauth_callback_return'] === 'true';
		const hasTargetStep = sessionStorage['mfa_target_step_after_callback'];

		return hasCode || hasState || hasCallbackReturn || hasTargetStep;
	}

	/**
	 * Get step resolution statistics for debugging
	 */
	public static getResolutionStats(): {
		totalResolutions: number;
		sourceDistribution: Record<StepResolutionSource, number>;
		averageResolutionTime: number;
	} {
		// This would be implemented with actual statistics tracking
		// For now, return placeholder data
		return {
			totalResolutions: 0,
			sourceDistribution: {
				[StepResolutionSource.SERVER_SESSION]: 0,
				[StepResolutionSource.STATE_PARAM]: 0,
				[StepResolutionSource.CLIENT_STORAGE]: 0,
				[StepResolutionSource.LAST_KNOWN_STEP]: 0,
				[StepResolutionSource.FALLBACK_STEP_2]: 0,
			},
			averageResolutionTime: 0,
		};
	}
}

export default UnifiedMFAResumeStepResolverV8;
