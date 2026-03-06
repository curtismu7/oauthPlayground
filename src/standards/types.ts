/**
 * @file src/standards/types.ts
 * @description Canonical type contracts for the OAuth Playground service layer.
 *
 * Decision (March 5, 2026): All service methods return `ServiceResult<T>`.
 * `throw` is reserved for programming errors only (invalid arguments,
 * impossible states, misconfigured invariants). Runtime failures (network
 * errors, validation, not-found) are `{ success: false, error: StandardError }`.
 * Callers check `result.success` before accessing `result.data`.
 *
 * Enforcement: `exactOptionalPropertyTypes: true` in tsconfig ensures callers
 * cannot access `result.data` without first checking `result.success`.
 */

// ---------------------------------------------------------------------------
// Standard Error Envelope — single source of truth for all service errors
// ---------------------------------------------------------------------------

export type StandardError = {
	/** Stable enum-like string — safe to match on in code */
	code: string;
	/** Human-readable message — safe for UI display */
	message: string;
	/** HTTP status code when the error originated from an HTTP response */
	httpStatus?: number;
	/** Correlation ID for cross-request tracing and support tickets */
	correlationId?: string;
	/** Whether the caller may safely retry this operation */
	retryable?: boolean;
	/** Structured payload for debugging — never render raw for users */
	details?: unknown;
};

// ---------------------------------------------------------------------------
// Service Result — standard return envelope for all service methods
// ---------------------------------------------------------------------------

export type ServiceResult<T = unknown> =
	| { success: true; data: T; error?: never }
	| { success: false; error: StandardError; data?: never };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Construct a successful ServiceResult */
export function ok<T>(data: T): ServiceResult<T> {
	return { success: true, data };
}

/** Construct a failed ServiceResult from a StandardError */
export function fail<T = never>(error: StandardError): ServiceResult<T> {
	return { success: false, error };
}

/** Construct a failed ServiceResult from an Error or string */
export function failFrom<T = never>(
	code: string,
	cause: unknown,
	httpStatus?: number
): ServiceResult<T> {
	const message =
		cause instanceof Error ? cause.message : typeof cause === 'string' ? cause : 'Unknown error';
	return fail<T>({ code, message, httpStatus, retryable: false });
}
