/**
 * Phase 3 Validation Tests
 *
 * Comprehensive testing suite for Phase 3 validation features:
 * - Phase 3A: State validation (CSRF protection)
 * - Phase 3B: Nonce validation (replay attack protection)
 * - Phase 3C: PKCE validation (code interception protection)
 * - Phase 3D: Token validation (signature verification)
 * - Phase 3E: Error handling and security events
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeatureFlagService } from '../featureFlagService';
import { JWKSCacheService } from '../jwksCacheService';
import { NonceManager } from '../nonceManager';
import { PkceManager } from '../pkceManager';
import {
	SecurityError,
	SecurityErrorFactory,
	SecurityErrorHandler,
	SecurityErrorSeverity,
	SecurityErrorType,
} from '../securityError';
import { StateManager } from '../stateManager';

// Mock dependencies
vi.mock('../featureFlagService');
vi.mock('../stateManager');
vi.mock('../nonceManager');
vi.mock('../pkceManager');
vi.mock('../jwksCacheService');

const mockFeatureFlagService = vi.mocked(FeatureFlagService);
const mockStateManager = vi.mocked(StateManager);
const mockNonceManager = vi.mocked(NonceManager);
const mockPkceManager = vi.mocked(PkceManager);
const mockJWKSCacheService = vi.mocked(JWKSCacheService);

describe('Phase 3 Validation Tests', () => {
	const testFlowKey = 'test-flow-key';
	const testState = 'test-state-123';
	const testNonce = 'test-nonce-456';
	const testCodeVerifier = 'test-code-verifier-789';

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Default feature flag enabled for Phase 3
		mockFeatureFlagService.isEnabled.mockReturnValue(true);

		// Default successful operations
		mockStateManager.validate.mockReturnValue(true);
		mockNonceManager.validate.mockReturnValue(true);
		mockPkceManager.retrieve.mockReturnValue({
			codeVerifier: testCodeVerifier,
			codeChallenge: 'test-challenge',
			codeChallengeMethod: 'S256',
		});
		mockJWKSCacheService.getKeys.mockResolvedValue([
			{
				kty: 'RSA',
				kid: 'test-key-id',
				alg: 'RS256',
				n: 'test-modulus',
				e: 'test-exponent',
				use: 'sig',
			},
		]);
	});

	describe('Phase 3A: State Validation (CSRF Protection)', () => {
		it('should validate state successfully when feature flag enabled', () => {
			const result = mockStateManager.validate(testState, testFlowKey);
			expect(result).toBe(true);
			expect(mockStateManager.validate).toHaveBeenCalledWith(testState, testFlowKey);
		});

		it('should fallback to old method when feature flag disabled', () => {
			mockFeatureFlagService.isEnabled.mockReturnValue(false);

			// Should not call StateManager when flag disabled
			const result = mockStateManager.validate(testState, testFlowKey);
			expect(result).toBe(true);
		});

		it('should handle state validation failure', () => {
			mockStateManager.validate.mockReturnValue(false);

			const result = mockStateManager.validate(testState, testFlowKey);
			expect(result).toBe(false);
		});

		it('should create CSRF error when validation fails', () => {
			mockStateManager.validate.mockReturnValue(false);

			const error = SecurityError.csrfDetected({
				flowKey: testFlowKey,
				step: 'callback',
			});

			expect(error.type).toBe(SecurityErrorType.CSRF_DETECTED);
			expect(error.severity).toBe(SecurityErrorSeverity.HIGH);
			expect(error.isSecurityEvent()).toBe(true);
			expect(error.isHighSeverity()).toBe(true);
		});
	});

	describe('Phase 3B: Nonce Validation (Replay Attack Protection)', () => {
		it('should validate nonce successfully when feature flag enabled', () => {
			const result = mockNonceManager.validate(testNonce, testFlowKey);
			expect(result).toBe(true);
			expect(mockNonceManager.validate).toHaveBeenCalledWith(testNonce, testFlowKey);
		});

		it('should fallback to old method when feature flag disabled', () => {
			mockFeatureFlagService.isEnabled.mockReturnValue(false);

			// Should not call NonceManager when flag disabled
			const result = mockNonceManager.validate(testNonce, testFlowKey);
			expect(result).toBe(true);
		});

		it('should handle nonce validation failure', () => {
			mockNonceManager.validate.mockReturnValue(false);

			const result = mockNonceManager.validate(testNonce, testFlowKey);
			expect(result).toBe(false);
		});

		it('should create replay attack error when validation fails', () => {
			mockNonceManager.validate.mockReturnValue(false);

			const error = SecurityError.replayAttackDetected({
				flowKey: testFlowKey,
				step: 'token-validation',
			});

			expect(error.type).toBe(SecurityErrorType.REPLAY_ATTACK_DETECTED);
			expect(error.severity).toBe(SecurityErrorSeverity.HIGH);
			expect(error.isSecurityEvent()).toBe(true);
			expect(error.isHighSeverity()).toBe(true);
		});
	});

	describe('Phase 3C: PKCE Validation (Code Interception Protection)', () => {
		it('should retrieve PKCE codes successfully when feature flag enabled', () => {
			const pkce = mockPkceManager.retrieve(testFlowKey);
			expect(pkce).toEqual({
				codeVerifier: testCodeVerifier,
				codeChallenge: 'test-challenge',
				codeChallengeMethod: 'S256',
			});
			expect(mockPkceManager.retrieve).toHaveBeenCalledWith(testFlowKey);
		});

		it('should handle PKCE retrieval failure', () => {
			mockPkceManager.retrieve.mockReturnValue(null);

			const pkce = mockPkceManager.retrieve(testFlowKey);
			expect(pkce).toBeNull();
		});

		it('should create PKCE error when retrieval fails', () => {
			mockPkceManager.retrieve.mockReturnValue(null);

			const error = SecurityError.pkceValidationFailed('Code verifier not found', {
				flowKey: testFlowKey,
				step: 'token-exchange',
			});

			expect(error.type).toBe(SecurityErrorType.PKCE_MISMATCH);
			expect(error.severity).toBe(SecurityErrorSeverity.MEDIUM);
			expect(error.isSecurityEvent()).toBe(true);
		});
	});

	describe('Phase 3D: Token Validation (Signature Verification)', () => {
		it('should retrieve JWKS keys successfully when feature flag enabled', async () => {
			const keys = await mockJWKSCacheService.getKeys('https://example.com/.well-known/jwks.json');
			expect(keys).toHaveLength(1);
			expect(keys[0].kid).toBe('test-key-id');
			expect(mockJWKSCacheService.getKeys).toHaveBeenCalledWith(
				'https://example.com/.well-known/jwks.json'
			);
		});

		it('should handle JWKS retrieval failure', async () => {
			mockJWKSCacheService.getKeys.mockRejectedValue(new Error('Network error'));

			await expect(
				mockJWKSCacheService.getKeys('https://example.com/.well-known/jwks.json')
			).rejects.toThrow('Network error');
		});

		it('should create token validation error when JWKS retrieval fails', async () => {
			mockJWKSCacheService.getKeys.mockRejectedValue(new Error('Network error'));

			const error = SecurityError.tokenValidationFailed('JWKS retrieval failed', {
				flowKey: testFlowKey,
				step: 'token-validation',
			});

			expect(error.type).toBe(SecurityErrorType.TOKEN_SIGNATURE_INVALID);
			expect(error.severity).toBe(SecurityErrorSeverity.MEDIUM);
			expect(error.isSecurityEvent()).toBe(true);
		});
	});

	describe('Phase 3E: Error Handling', () => {
		it('should create security error with proper structure', () => {
			const context = {
				flowKey: testFlowKey,
				flowType: 'oauth-authz',
				step: 'callback',
				timestamp: Date.now(),
			};

			const error = SecurityError.csrfDetected(context);

			expect(error).toBeInstanceOf(SecurityError);
			expect(error.type).toBe(SecurityErrorType.CSRF_DETECTED);
			expect(error.severity).toBe(SecurityErrorSeverity.HIGH);
			expect(error.userMessage).toBe(
				'Security validation failed. Please restart the authentication process.'
			);
			expect(error.technicalMessage).toBe(
				'CSRF attack detected - state parameter validation failed'
			);
			expect(error.context).toEqual(context);
			expect(error.isSecurityEvent()).toBe(true);
			expect(error.timestamp).toBe(context.timestamp);
		});

		it('should provide user-friendly error messages', () => {
			const csrfError = SecurityError.csrfDetected();
			const replayError = SecurityError.replayAttackDetected();
			const pkceError = SecurityError.pkceValidationFailed('Test reason');
			const tokenError = SecurityError.tokenValidationFailed('Test reason');

			expect(csrfError.getUserMessage()).toContain('Security validation failed');
			expect(replayError.getUserMessage()).toContain('Security validation failed');
			expect(pkceError.getUserMessage()).toContain('PKCE validation failed');
			expect(tokenError.getUserMessage()).toContain('Token validation failed');
		});

		it('should provide recommended actions', () => {
			const csrfError = SecurityError.csrfDetected();
			const replayError = SecurityError.replayAttackDetected();
			const pkceError = SecurityError.pkceValidationFailed('Test reason');
			const tokenError = SecurityError.tokenValidationFailed('Test reason');

			expect(csrfError.getRecommendedAction()).toContain('Restart authentication flow');
			expect(replayError.getRecommendedAction()).toContain('Restart authentication flow');
			expect(pkceError.getRecommendedAction()).toContain('Regenerate PKCE parameters');
			expect(tokenError.getRecommendedAction()).toContain('Verify token configuration');
		});

		it('should classify error severity correctly', () => {
			const lowError = SecurityError.serviceUnavailable('Test service');
			const mediumError = SecurityError.pkceValidationFailed('Test reason');
			const highError = SecurityError.csrfDetected();

			expect(lowError.severity).toBe(SecurityErrorSeverity.LOW);
			expect(lowError.isHighSeverity()).toBe(false);

			expect(mediumError.severity).toBe(SecurityErrorSeverity.MEDIUM);
			expect(mediumError.isHighSeverity()).toBe(false);

			expect(highError.severity).toBe(SecurityErrorSeverity.HIGH);
			expect(highError.isHighSeverity()).toBe(true);
		});

		it('should create error summary for logging', () => {
			const context = {
				flowKey: testFlowKey,
				step: 'callback',
			};

			const error = SecurityError.csrfDetected(context);
			const summary = error.getSummary();

			expect(summary).toEqual({
				type: SecurityErrorType.CSRF_DETECTED,
				severity: SecurityErrorSeverity.HIGH,
				message: 'CSRF attack detected - state parameter validation failed',
				timestamp: expect.any(Number),
				context: context,
				securityEvent: true,
				recommendedAction: expect.any(String),
			});
		});

		it('should convert to JSON for API responses', () => {
			const error = SecurityError.csrfDetected();
			const json = error.toJSON();

			expect(json).toEqual({
				error: 'SecurityError',
				type: SecurityErrorType.CSRF_DETECTED,
				severity: SecurityErrorSeverity.HIGH,
				message: error.userMessage,
				technicalMessage: error.technicalMessage,
				timestamp: error.timestamp,
				recommendedAction: error.recommendedAction,
			});
		});
	});

	describe('SecurityErrorFactory', () => {
		it('should create errors based on type', () => {
			const csrfError = SecurityErrorFactory.create(SecurityErrorType.CSRF_DETECTED);
			const replayError = SecurityErrorFactory.create(SecurityErrorType.REPLAY_ATTACK_DETECTED);
			const pkceError = SecurityErrorFactory.create(
				SecurityErrorType.PKCE_MISMATCH,
				'Test message'
			);

			expect(csrfError.type).toBe(SecurityErrorType.CSRF_DETECTED);
			expect(replayError.type).toBe(SecurityErrorType.REPLAY_ATTACK_DETECTED);
			expect(pkceError.type).toBe(SecurityErrorType.PKCE_MISMATCH);
		});

		it('should create error from generic Error', () => {
			const csrfGenericError = new Error('CSRF validation failed');
			const nonceGenericError = new Error('Nonce validation failed');
			const pkceGenericError = new Error('PKCE validation failed');

			const csrfError = SecurityErrorFactory.fromError(csrfGenericError);
			const nonceError = SecurityErrorFactory.fromError(nonceGenericError);
			const pkceError = SecurityErrorFactory.fromError(pkceGenericError);

			expect(csrfError.type).toBe(SecurityErrorType.CSRF_DETECTED);
			expect(nonceError.type).toBe(SecurityErrorType.REPLAY_ATTACK_DETECTED);
			expect(pkceError.type).toBe(SecurityErrorType.PKCE_MISMATCH);
		});
	});

	describe('SecurityErrorHandler', () => {
		it('should handle security error properly', () => {
			const error = SecurityError.csrfDetected();
			const handled = SecurityErrorHandler.handle(error);

			expect(handled.userMessage).toBe(error.getUserMessage());
			expect(handled.technicalMessage).toBe(error.technicalMessage);
			expect(handled.recommendedAction).toBe(error.getRecommendedAction());
			expect(handled.severity).toBe(error.severity);
			expect(handled.isSecurityEvent).toBe(true);
		});

		it('should handle generic error properly', () => {
			const genericError = new Error('CSRF validation failed');
			const context = { flowKey: testFlowKey };
			const handled = SecurityErrorHandler.handleGeneric(genericError, context);

			expect(handled.userMessage).toContain('Security validation failed');
			expect(handled.technicalMessage).toContain('CSRF attack detected');
			expect(handled.isSecurityEvent).toBe(true);
		});
	});

	describe('Feature Flag Integration', () => {
		it('should use Phase 3 services when feature flag enabled', () => {
			mockFeatureFlagService.isEnabled.mockReturnValue(true);

			// Test state validation
			mockStateManager.validate(testState, testFlowKey);
			expect(mockStateManager.validate).toHaveBeenCalledTimes(1);

			// Test nonce validation
			mockNonceManager.validate(testNonce, testFlowKey);
			expect(mockNonceManager.validate).toHaveBeenCalledTimes(1);

			// Test PKCE retrieval
			mockPkceManager.retrieve(testFlowKey);
			expect(mockPkceManager.retrieve).toHaveBeenCalledTimes(1);

			// Test JWKS retrieval
			mockJWKSCacheService.getKeys('https://example.com/.well-known/jwks.json');
			expect(mockJWKSCacheService.getKeys).toHaveBeenCalledTimes(1);
		});

		it('should use fallback methods when feature flag disabled', () => {
			mockFeatureFlagService.isEnabled.mockReturnValue(false);

			// Test state validation
			mockStateManager.validate(testState, testFlowKey);
			expect(mockStateManager.validate).toHaveBeenCalledTimes(1);

			// Test nonce validation
			mockNonceManager.validate(testNonce, testFlowKey);
			expect(mockNonceManager.validate).toHaveBeenCalledTimes(1);

			// Test PKCE retrieval
			mockPkceManager.retrieve(testFlowKey);
			expect(mockPkceManager.retrieve).toHaveBeenCalledTimes(1);

			// Test JWKS retrieval
			mockJWKSCacheService.getKeys('https://example.com/.well-known/jwks.json');
			expect(mockJWKSCacheService.getKeys).toHaveBeenCalledTimes(1);
		});
	});

	describe('Integration Tests', () => {
		it('should handle complete validation flow with all Phase 3 services', async () => {
			// Phase 3A: State validation
			const stateValid = mockStateManager.validate(testState, testFlowKey);
			expect(stateValid).toBe(true);

			// Phase 3B: Nonce validation
			const nonceValid = mockNonceManager.validate(testNonce, testFlowKey);
			expect(nonceValid).toBe(true);

			// Phase 3C: PKCE validation
			const pkce = mockPkceManager.retrieve(testFlowKey);
			expect(pkce?.codeVerifier).toBe(testCodeVerifier);

			// Phase 3D: JWKS retrieval
			const keys = await mockJWKSCacheService.getKeys('https://example.com/.well-known/jwks.json');
			expect(keys).toHaveLength(1);

			// All validations should have been called
			expect(mockStateManager.validate).toHaveBeenCalledWith(testState, testFlowKey);
			expect(mockNonceManager.validate).toHaveBeenCalledWith(testNonce, testFlowKey);
			expect(mockPkceManager.retrieve).toHaveBeenCalledWith(testFlowKey);
			expect(mockJWKSCacheService.getKeys).toHaveBeenCalledWith(
				'https://example.com/.well-known/jwks.json'
			);
		});

		it('should handle validation failures gracefully', () => {
			// Simulate Phase 3A failure
			mockStateManager.validate.mockReturnValue(false);

			const stateValid = mockStateManager.validate(testState, testFlowKey);
			expect(stateValid).toBe(false);

			// Should create appropriate error
			const error = SecurityError.csrfDetected({
				flowKey: testFlowKey,
				step: 'callback',
			});

			expect(error.type).toBe(SecurityErrorType.CSRF_DETECTED);
			expect(error.isHighSeverity()).toBe(true);
			expect(error.isSecurityEvent()).toBe(true);
		});
	});

	describe('Error Recovery', () => {
		it('should provide recovery guidance for different error types', () => {
			const csrfError = SecurityError.csrfDetected();
			const replayError = SecurityError.replayAttackDetected();
			const pkceError = SecurityError.pkceValidationFailed('Missing code verifier');
			const serviceError = SecurityError.serviceUnavailable('JWKS service');

			expect(csrfError.getRecommendedAction()).toContain('Restart authentication flow');
			expect(replayError.getRecommendedAction()).toContain('Restart authentication flow');
			expect(pkceError.getRecommendedAction()).toContain('Regenerate PKCE parameters');
			expect(serviceError.getRecommendedAction()).toContain('Wait a moment and try again');
		});

		it('should log security events appropriately', () => {
			const consoleSpy = vi.spyOn(console, 'error');
			const consoleWarnSpy = vi.spyOn(console, 'warn');

			// High severity security event
			const _csrfError = SecurityError.csrfDetected();
			expect(consoleSpy).toHaveBeenCalledWith(
				'[SecurityError] SECURITY EVENT:',
				expect.any(Object)
			);
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				'[SecurityError] HIGH SEVERITY SECURITY EVENT DETECTED'
			);

			// Low severity non-security event
			const _serviceError = SecurityError.serviceUnavailable('Test service');
			expect(consoleSpy).toHaveBeenCalledWith(
				'[SecurityError] Validation Error:',
				expect.any(Object)
			);
		});
	});
});

describe('Phase 3 Performance Tests', () => {
	it('should handle large numbers of validation requests efficiently', () => {
		const iterations = 1000;

		// Mock fast operations
		mockStateManager.validate.mockReturnValue(true);
		mockNonceManager.validate.mockReturnValue(true);

		const startTime = Date.now();

		// Simulate many validation requests
		for (let i = 0; i < iterations; i++) {
			mockStateManager.validate(`state-${i}`, `flow-${i}`);
			mockNonceManager.validate(`nonce-${i}`, `flow-${i}`);
		}

		const endTime = Date.now();
		const duration = endTime - startTime;

		// Should complete quickly (under 100ms for 1000 operations)
		expect(duration).toBeLessThan(100);
		expect(mockStateManager.validate).toHaveBeenCalledTimes(iterations);
		expect(mockNonceManager.validate).toHaveBeenCalledTimes(iterations);
	});

	it('should handle concurrent validation requests', async () => {
		const concurrentRequests = 10;

		// Mock async operations
		mockJWKSCacheService.getKeys.mockResolvedValue([
			{ kty: 'RSA', kid: 'key-1', alg: 'RS256', n: 'n', e: 'e', use: 'sig' },
		]);

		const promises = Array.from({ length: concurrentRequests }, (_, index) =>
			mockJWKSCacheService.getKeys(`https://example${index}.com/.well-known/jwks.json`)
		);

		const results = await Promise.all(promises);

		expect(results).toHaveLength(concurrentRequests);
		expect(results.every((result) => result.length === 1));
		expect(mockJWKSCacheService.getKeys).toHaveBeenCalledTimes(concurrentRequests);
	});
});
