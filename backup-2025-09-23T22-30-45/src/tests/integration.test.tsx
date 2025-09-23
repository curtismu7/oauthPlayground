/**
 * Integration tests for secureTokenStorage with UI components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { storeOAuthTokens, getOAuthTokens, clearOAuthTokens, hasValidOAuthTokens } from '../utils/tokenStorage';
import { secureTokenStorage } from '../utils/secureTokenStorage';

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
  })
};

// Mock global sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

// Mock console methods
const originalConsole = console;
beforeEach(() => {
  console.log = vi.fn();
  console.error = vi.fn();
  console.warn = vi.fn();
  mockSessionStorage.clear();
  vi.clearAllMocks();
});

describe('Secure Token Storage Integration', () => {
  const mockTokens = {
    access_token: 'test-access-token-12345',
    id_token: 'test-id-token-67890',
    refresh_token: 'test-refresh-token-abcde',
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'openid profile email'
  };

  describe('Token Storage Operations', () => {
    it('should store tokens securely and retrieve them correctly', () => {
      // Store tokens
      const storeResult = storeOAuthTokens(mockTokens, 'authorization-code', 'Test Flow');
      expect(storeResult).toBe(true);

      // Verify tokens are stored in sessionStorage (not localStorage)
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'pingone_secure_tokens',
        expect.any(String)
      );

      // Retrieve tokens
      const retrievedTokens = getOAuthTokens();
      expect(retrievedTokens).toEqual({
        ...mockTokens,
        timestamp: expect.any(Number)
      });

      // Verify tokens are valid
      const hasValid = hasValidOAuthTokens();
      expect(hasValid).toBe(true);
    });

    it('should handle token expiration correctly', () => {
      const expiredTokens = {
        ...mockTokens,
        timestamp: Date.now() - 4000000, // 4000 seconds ago
        expires_in: 3600 // 1 hour
      };

      // Store expired tokens
      const storeResult = storeOAuthTokens(expiredTokens, 'authorization-code', 'Test Flow');
      expect(storeResult).toBe(true);

      // Check if valid (should be false due to expiration)
      const hasValid = hasValidOAuthTokens();
      expect(hasValid).toBe(false);
    });

    it('should clear tokens securely', () => {
      // Store tokens first
      storeOAuthTokens(mockTokens, 'authorization-code', 'Test Flow');
      
      // Clear tokens
      const clearResult = clearOAuthTokens();
      expect(clearResult).toBe(true);

      // Verify tokens are cleared
      const retrievedTokens = getOAuthTokens();
      expect(retrievedTokens).toBeNull();

      // Verify hasValid returns false
      const hasValid = hasValidOAuthTokens();
      expect(hasValid).toBe(false);
    });
  });

  describe('Security Features', () => {
    it('should encrypt tokens before storage', () => {
      // Store tokens
      storeOAuthTokens(mockTokens, 'authorization-code', 'Test Flow');

      // Get the stored encrypted data
      const storedData = mockSessionStorage.store['pingone_secure_tokens'];
      
      // Verify the stored data is encrypted (doesn't contain plain text tokens)
      expect(storedData).not.toContain('test-access-token-12345');
      expect(storedData).not.toContain('test-id-token-67890');
      expect(storedData).not.toContain('test-refresh-token-abcde');
      
      // But should be able to decrypt and retrieve the original tokens
      const retrievedTokens = getOAuthTokens();
      expect(retrievedTokens?.access_token).toBe('test-access-token-12345');
    });

    it('should handle corrupted storage data gracefully', () => {
      // Store corrupted data directly
      mockSessionStorage.store['pingone_secure_tokens'] = 'corrupted-encrypted-data';
      
      // Try to retrieve tokens
      const retrievedTokens = getOAuthTokens();
      expect(retrievedTokens).toBeNull();
      
      // Should have cleared the corrupted data
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('pingone_secure_tokens');
    });

    it('should automatically clear tokens that are too old', () => {
      // Store tokens
      storeOAuthTokens(mockTokens, 'authorization-code', 'Test Flow');
      
      // Manually modify storage time to be very old (25+ hours)
      const storedData = mockSessionStorage.store['pingone_secure_tokens'];
      
      // Create a mock old token data structure
      const oldTokenData = {
        ...mockTokens,
        timestamp: Date.now(),
        storageTime: Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
      };
      
      // Store the old data directly (simulating what would happen with old tokens)
      mockSessionStorage.store['pingone_secure_tokens'] = btoa(JSON.stringify(oldTokenData));
      
      // Try to retrieve - should return null and clear storage
      const retrievedTokens = getOAuthTokens();
      expect(retrievedTokens).toBeNull();
    });
  });

  describe('Token Lifecycle Integration', () => {
    it('should work with token lifecycle management', () => {
      // Store tokens with flow information
      const storeResult = storeOAuthTokens(mockTokens, 'authorization-code', 'Authorization Code Flow');
      expect(storeResult).toBe(true);

      // Verify tokens are stored and retrievable
      const retrievedTokens = getOAuthTokens();
      expect(retrievedTokens).toBeDefined();
      expect(retrievedTokens?.access_token).toBe(mockTokens.access_token);

      // Verify tokens are valid
      const hasValid = hasValidOAuthTokens();
      expect(hasValid).toBe(true);
    });

    it('should handle multiple token operations', () => {
      // Store initial tokens
      storeOAuthTokens(mockTokens, 'authorization-code', 'Initial Flow');
      
      // Verify initial tokens
      let retrievedTokens = getOAuthTokens();
      expect(retrievedTokens?.access_token).toBe('test-access-token-12345');

      // Store new tokens (simulating token refresh)
      const newTokens = {
        ...mockTokens,
        access_token: 'new-access-token-54321',
        refresh_token: 'new-refresh-token-fghij'
      };
      
      const storeResult = storeOAuthTokens(newTokens, 'refresh-token', 'Token Refresh');
      expect(storeResult).toBe(true);

      // Verify new tokens are stored
      retrievedTokens = getOAuthTokens();
      expect(retrievedTokens?.access_token).toBe('new-access-token-54321');
      expect(retrievedTokens?.refresh_token).toBe('new-refresh-token-fghij');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', () => {
      // Mock storage to throw error
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Try to store tokens
      const storeResult = storeOAuthTokens(mockTokens, 'authorization-code', 'Test Flow');
      expect(storeResult).toBe(false);
    });

    it('should handle retrieval errors gracefully', () => {
      // Store tokens first
      storeOAuthTokens(mockTokens, 'authorization-code', 'Test Flow');
      
      // Mock storage to throw error on getItem
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('Storage read error');
      });

      // Try to retrieve tokens
      const retrievedTokens = getOAuthTokens();
      expect(retrievedTokens).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid operations efficiently', () => {
      const startTime = performance.now();
      
      // Perform multiple operations rapidly
      for (let i = 0; i < 10; i++) {
        const tokens = {
          ...mockTokens,
          access_token: `token-${i}`
        };
        storeOAuthTokens(tokens, 'authorization-code', `Flow ${i}`);
        getOAuthTokens();
        hasValidOAuthTokens();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // 1 second
    });
  });
});
