/**
 * Comprehensive tests for secureTokenStorage implementation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	SecureTokenStorageImpl,
	SimpleEncryption,
	secureTokenStorage,
} from '../utils/secureTokenStorage';
import { OAuthTokens } from '../utils/tokenStorage';

// Mock sessionStorage for testing
const mockSessionStorage = {
	store: {} as Record<string, string>,
	getItem: vi.fn((key: string) => mockSessionStorage.store[key] || null),
	setItem: vi.fn((key: string, value: string) => {
		mockSessionStorage.store[key] = value;
	}),
	removeItem: vi.fn((key: string) => {
		delete mockSessionStorage.store[key];
	}),
	clear: vi.fn(() => {
		mockSessionStorage.store = {};
	}),
};

// Mock global sessionStorage
Object.defineProperty(window, 'sessionStorage', {
	value: mockSessionStorage,
	writable: true,
});

// Mock console methods to avoid noise in tests
const originalConsole = console;
beforeEach(() => {
	console.log = vi.fn();
	console.error = vi.fn();
	console.warn = vi.fn();
});

describe('SecureTokenStorage', () => {
	beforeEach(() => {
		// Clear mock storage before each test
		mockSessionStorage.clear();
		vi.clearAllMocks();
	});

	describe('SimpleEncryption', () => {
		it('should encrypt and decrypt text correctly', () => {
			const originalText = 'test-token-data';
			const encrypted = SimpleEncryption.encrypt(originalText);
			const decrypted = SimpleEncryption.decrypt(encrypted);

			expect(encrypted).not.toBe(originalText);
			expect(decrypted).toBe(originalText);
		});

		it('should handle empty string', () => {
			const originalText = '';
			const encrypted = SimpleEncryption.encrypt(originalText);
			const decrypted = SimpleEncryption.decrypt(encrypted);

			expect(decrypted).toBe(originalText);
		});

		it('should handle special characters', () => {
			const originalText = '{"access_token":"abc123","expires_in":3600}';
			const encrypted = SimpleEncryption.encrypt(originalText);
			const decrypted = SimpleEncryption.decrypt(encrypted);

			expect(decrypted).toBe(originalText);
		});
	});

	describe('SecureTokenStorageImpl', () => {
		const mockTokens: OAuthTokens = {
			access_token: 'test-access-token',
			id_token: 'test-id-token',
			refresh_token: 'test-refresh-token',
			token_type: 'Bearer',
			expires_in: 3600,
			scope: 'openid profile email',
		};

		it('should store tokens securely', () => {
			const result = secureTokenStorage.storeTokens(mockTokens);

			expect(result).toBe(true);
			expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
				'pingone_secure_tokens',
				expect.any(String)
			);

			// Verify the stored data is encrypted (not plain JSON)
			const storedData = mockSessionStorage.store['pingone_secure_tokens'];
			expect(storedData).not.toContain('test-access-token');
			expect(storedData).not.toContain('test-id-token');
		});

		it('should retrieve tokens correctly', () => {
			// First store tokens
			secureTokenStorage.storeTokens(mockTokens);

			// Then retrieve them
			const retrievedTokens = secureTokenStorage.getTokens();

			expect(retrievedTokens).toEqual({
				...mockTokens,
				timestamp: expect.any(Number),
			});
		});

		it('should return null when no tokens exist', () => {
			const retrievedTokens = secureTokenStorage.getTokens();
			expect(retrievedTokens).toBeNull();
		});

		it('should clear tokens correctly', () => {
			// Store tokens first
			secureTokenStorage.storeTokens(mockTokens);

			// Clear them
			const result = secureTokenStorage.clearTokens();

			expect(result).toBe(true);
			expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('pingone_secure_tokens');

			// Verify tokens are gone
			const retrievedTokens = secureTokenStorage.getTokens();
			expect(retrievedTokens).toBeNull();
		});

		it('should detect valid tokens', () => {
			// Store tokens
			secureTokenStorage.storeTokens(mockTokens);

			// Check if valid
			const hasValid = secureTokenStorage.hasValidTokens();
			expect(hasValid).toBe(true);
		});

		it('should detect expired tokens', () => {
			const expiredTokens: OAuthTokens = {
				...mockTokens,
				timestamp: Date.now() - 4000000, // 4000 seconds ago
				expires_in: 3600, // 1 hour
			};

			// Store expired tokens
			secureTokenStorage.storeTokens(expiredTokens);

			// Check if valid (should be false due to expiration)
			const hasValid = secureTokenStorage.hasValidTokens();
			expect(hasValid).toBe(false);
		});

		it('should return null for tokens without access_token', () => {
			const invalidTokens = {
				...mockTokens,
				access_token: '',
			};

			secureTokenStorage.storeTokens(invalidTokens);
			const hasValid = secureTokenStorage.hasValidTokens();
			expect(hasValid).toBe(false);
		});

		it('should get token expiration status correctly', () => {
			const tokensWithTimestamp: OAuthTokens = {
				...mockTokens,
				timestamp: Date.now(),
				expires_in: 3600,
			};

			secureTokenStorage.storeTokens(tokensWithTimestamp);
			const status = secureTokenStorage.getTokenExpirationStatus();

			expect(status.hasTokens).toBe(true);
			expect(status.isExpired).toBe(false);
			expect(status.expiresAt).toBeInstanceOf(Date);
			expect(status.timeRemaining).toBeGreaterThan(0);
		});

		it('should handle corrupted storage data gracefully', () => {
			// Store corrupted data directly
			mockSessionStorage.store['pingone_secure_tokens'] = 'corrupted-data';

			const retrievedTokens = secureTokenStorage.getTokens();
			expect(retrievedTokens).toBeNull();

			// Should have cleared the corrupted data
			expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('pingone_secure_tokens');
		});

		it('should handle tokens that are too old', () => {
			const oldTokens: OAuthTokens = {
				...mockTokens,
				timestamp: Date.now(),
				expires_in: 3600,
			};

			// Store tokens
			secureTokenStorage.storeTokens(oldTokens);

			// Manually modify storage time to be very old
			const storedData = mockSessionStorage.store['pingone_secure_tokens'];
			const decrypted = SimpleEncryption.decrypt(storedData);
			const parsed = JSON.parse(decrypted);
			parsed.storageTime = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
			const reencrypted = SimpleEncryption.encrypt(JSON.stringify(parsed));
			mockSessionStorage.store['pingone_secure_tokens'] = reencrypted;

			// Try to retrieve - should return null and clear storage
			const retrievedTokens = secureTokenStorage.getTokens();
			expect(retrievedTokens).toBeNull();
		});
	});

	describe('Integration with tokenStorage', () => {
		it('should work with the main tokenStorage interface', async () => {
			const { storeOAuthTokens, getOAuthTokens, clearOAuthTokens, hasValidOAuthTokens } =
				await import('../utils/tokenStorage');

			const mockTokens: OAuthTokens = {
				access_token: 'integration-test-token',
				token_type: 'Bearer',
				expires_in: 3600,
				scope: 'openid',
			};

			// Test store
			const storeResult = storeOAuthTokens(mockTokens, 'authorization-code', 'Test Flow');
			expect(storeResult).toBe(true);

			// Test retrieve
			const retrievedTokens = getOAuthTokens();
			expect(retrievedTokens).toEqual({
				...mockTokens,
				timestamp: expect.any(Number),
			});

			// Test hasValid
			const hasValid = hasValidOAuthTokens();
			expect(hasValid).toBe(true);

			// Test clear
			const clearResult = clearOAuthTokens();
			expect(clearResult).toBe(true);

			// Verify cleared
			const clearedTokens = getOAuthTokens();
			expect(clearedTokens).toBeNull();
		});
	});
});
