/**
 * @file mfaNextStepNormalizer.ts
 * @module v8/utils
 * @description Normalizes MFA nextStep/status values to prevent UI regressions
 * @version 1.0.0
 * @since 2026-01-31
 *
 * Purpose: Prevent regressions where the UI falls into a default path or hides features
 * because the controller/service returns a status the UI flows don't handle.
 *
 * Problem: UI flow components switch on `nextStep` and only handle:
 * - COMPLETED
 * - OTP_REQUIRED
 * - SELECTION_REQUIRED
 *
 * But the controller/service can return variants like:
 * - DEVICE_SELECTION_REQUIRED
 * - PASSCODE_REQUIRED
 *
 * Solution: Normalize all variants to the stable set used by UI
 */

/**
 * Normalized MFA next step values used by UI
 */
export type NormalizedMfaNextStep = 'COMPLETED' | 'OTP_REQUIRED' | 'SELECTION_REQUIRED';

/**
 * All possible MFA next step values from service/controller
 */
export type MfaNextStepVariant =
	| 'COMPLETED'
	| 'OTP_REQUIRED'
	| 'PASSCODE_REQUIRED'
	| 'SELECTION_REQUIRED'
	| 'DEVICE_SELECTION_REQUIRED'
	| string; // Allow unknown strings for future-proofing

/**
 * Normalizes MFA nextStep/status values to stable UI-compatible values
 *
 * Mappings:
 * - DEVICE_SELECTION_REQUIRED → SELECTION_REQUIRED
 * - PASSCODE_REQUIRED → OTP_REQUIRED
 * - Known values pass through unchanged
 * - Unknown values default to SELECTION_REQUIRED (safe fallback)
 *
 * @param step - The nextStep or status value from service/controller
 * @returns Normalized step value guaranteed to be handled by UI
 *
 * @example
 * ```ts
 * const result = await mfaService.initializeDeviceAuthentication(...);
 * return {
 *   ...result,
 *   nextStep: normalizeMfaNextStep(result.nextStep ?? result.status),
 * };
 * ```
 */
export function normalizeMfaNextStep(step: string | undefined | null): NormalizedMfaNextStep {
	// Handle null/undefined
	if (!step) {
		console.warn('[MFA-NORMALIZER] Received null/undefined step, defaulting to SELECTION_REQUIRED');
		return 'SELECTION_REQUIRED';
	}

	// Normalize to uppercase for case-insensitive comparison
	const normalizedInput = step.toUpperCase().trim();

	switch (normalizedInput) {
		// COMPLETED - pass through
		case 'COMPLETED':
			return 'COMPLETED';

		// OTP_REQUIRED variants
		case 'OTP_REQUIRED':
		case 'PASSCODE_REQUIRED':
		case 'CODE_REQUIRED':
		case 'VERIFICATION_REQUIRED':
			return 'OTP_REQUIRED';

		// SELECTION_REQUIRED variants
		case 'SELECTION_REQUIRED':
		case 'DEVICE_SELECTION_REQUIRED':
		case 'CHOOSE_DEVICE':
		case 'SELECT_DEVICE':
			return 'SELECTION_REQUIRED';

		// Unknown value - log warning and use safe default
		default:
			console.warn(
				`[MFA-NORMALIZER] Unknown MFA step value: "${step}". Defaulting to SELECTION_REQUIRED. ` +
					`Please update normalizeMfaNextStep() to handle this value explicitly.`
			);
			return 'SELECTION_REQUIRED';
	}
}

/**
 * Type guard to check if a value is a valid normalized MFA next step
 *
 * @param value - Value to check
 * @returns True if value is a valid normalized step
 */
export function isNormalizedMfaNextStep(value: unknown): value is NormalizedMfaNextStep {
	return (
		typeof value === 'string' &&
		(value === 'COMPLETED' || value === 'OTP_REQUIRED' || value === 'SELECTION_REQUIRED')
	);
}

/**
 * Normalizes MFA response object with nextStep field
 *
 * Convenience function for normalizing entire response objects
 *
 * @param response - MFA service response with nextStep or status field
 * @returns Response with normalized nextStep
 */
export function normalizeMfaResponse<T extends { nextStep?: string; status?: string }>(
	response: T
): T & { nextStep: NormalizedMfaNextStep } {
	return {
		...response,
		nextStep: normalizeMfaNextStep(response.nextStep ?? response.status),
	};
}
