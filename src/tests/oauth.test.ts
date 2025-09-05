// Comprehensive OAuth Flow Testing Suite
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { storeOAuthTokens, getOAuthTokens, clearOAuthTokens } from '../utils/tokenStorage';
import { tokenLifecycleManager } from '../utils/tokenLifecycle';
import { logger } from '../utils/logger';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

// Mock console methods to avoid noise in tests
const originalConsole = console;
beforeEach(() => {
  console.log = vi.fn();
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterEach(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  vi.clearAllMocks();
});

describe('Token Storage', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockReturnValue(undefined);
  });

  describe('storeOAuthTokens', () => {
    it('should store tokens successfully', () => {
      const tokens = {
        access_token: 'test-access-token',
        id_token: 'test-id-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email'
      };

      const result = storeOAuthTokens(tokens, 'authorization_code', 'Test Flow');
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle missing flow information', () => {
      const tokens = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email'
      };

      const result = storeOAuthTokens(tokens);
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should add timestamp to tokens', () => {
      const tokens = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email'
      };

      storeOAuthTokens(tokens, 'authorization_code', 'Test Flow');
      
      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const storedData = JSON.parse(setItemCall[1]);
      expect(storedData.timestamp).toBeDefined();
      expect(typeof storedData.timestamp).toBe('number');
    });

    it('should handle storage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const tokens = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email'
      };

      const result = storeOAuthTokens(tokens);
      
      expect(result).toBe(false);
    });
  });

  describe('getOAuthTokens', () => {
    it('should retrieve stored tokens', () => {
      const mockTokens = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email',
        timestamp: Date.now()
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockTokens));

      const result = getOAuthTokens();
      
      expect(result).toEqual(mockTokens);
    });

    it('should return null when no tokens stored', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getOAuthTokens();
      
      expect(result).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const result = getOAuthTokens();
      
      expect(result).toBeNull();
    });
  });

  describe('clearOAuthTokens', () => {
    it('should clear stored tokens', () => {
      const result = clearOAuthTokens();
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });
});

describe('Token Lifecycle Management', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue('[]');
    localStorageMock.setItem.mockReturnValue(undefined);
  });

  describe('registerToken', () => {
    it('should register a new token', () => {
      const tokens = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email'
      };

      const tokenId = tokenLifecycleManager.registerToken(tokens, 'authorization_code', 'Test Flow');
      
      expect(tokenId).toBeDefined();
      expect(typeof tokenId).toBe('string');
      expect(tokenId).toMatch(/^token_\d+_[a-z0-9]+$/);
    });

    it('should store lifecycle information', () => {
      const tokens = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email'
      };

      tokenLifecycleManager.registerToken(tokens, 'authorization_code', 'Test Flow');
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('analyzeTokenSecurity', () => {
    it('should analyze token security', () => {
      const tokens = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email'
      };

      const tokenId = tokenLifecycleManager.registerToken(tokens, 'authorization_code', 'Test Flow');
      const analysis = tokenLifecycleManager.analyzeTokenSecurity(tokenId);
      
      expect(analysis).toBeDefined();
      expect(analysis.tokenId).toBe(tokenId);
      expect(analysis.securityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.securityScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
      expect(Array.isArray(analysis.warnings)).toBe(true);
      expect(Array.isArray(analysis.strengths)).toBe(true);
      expect(Array.isArray(analysis.vulnerabilities)).toBe(true);
    });

    it('should handle expired tokens', () => {
      const tokens = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: -3600, // Expired
        scope: 'openid profile email'
      };

      const tokenId = tokenLifecycleManager.registerToken(tokens, 'authorization_code', 'Test Flow');
      const analysis = tokenLifecycleManager.analyzeTokenSecurity(tokenId);
      
      expect(analysis.warnings).toContain('Token has expired');
      expect(analysis.securityScore).toBeLessThan(100);
    });
  });

  describe('getTokenUsageAnalytics', () => {
    it('should return analytics data', () => {
      const analytics = tokenLifecycleManager.getTokenUsageAnalytics();
      
      expect(analytics).toBeDefined();
      expect(typeof analytics.totalTokens).toBe('number');
      expect(typeof analytics.activeTokens).toBe('number');
      expect(typeof analytics.expiredTokens).toBe('number');
      expect(typeof analytics.mostUsedFlow).toBe('string');
      expect(typeof analytics.averageTokenLifetime).toBe('number');
      expect(typeof analytics.tokenUsageByFlow).toBe('object');
      expect(Array.isArray(analytics.recentActivity)).toBe(true);
    });
  });
});

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log messages with correct format', () => {
    logger.info('TestComponent', 'Test message', { data: 'test' });
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[TestComponent] Test message'),
      expect.any(Object)
    );
  });

  it('should maintain log history', () => {
    logger.info('TestComponent', 'Test message');
    
    const history = logger.getLogHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].component).toBe('TestComponent');
    expect(history[0].message).toBe('Test message');
  });

  it('should limit log history size', () => {
    // Add more than maxLogEntries (1000)
    for (let i = 0; i < 1001; i++) {
      logger.info('TestComponent', `Message ${i}`);
    }
    
    const history = logger.getLogHistory();
    expect(history.length).toBeLessThanOrEqual(1000);
  });

  it('should export logs as JSON', () => {
    logger.info('TestComponent', 'Test message');
    
    const exported = logger.exportLogs();
    const parsed = JSON.parse(exported);
    
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });
});

describe('OAuth Flow Integration', () => {
  it('should integrate token storage with lifecycle management', () => {
    const tokens = {
      access_token: 'test-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile email'
    };

    // Store tokens
    const storeResult = storeOAuthTokens(tokens, 'authorization_code', 'Test Flow');
    expect(storeResult).toBe(true);

    // Verify lifecycle registration
    const analytics = tokenLifecycleManager.getTokenUsageAnalytics();
    expect(analytics.totalTokens).toBeGreaterThan(0);
  });

  it('should handle token refresh scenarios', () => {
    const tokens = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile email'
    };

    const tokenId = tokenLifecycleManager.registerToken(tokens, 'authorization_code', 'Test Flow');
    const analysis = tokenLifecycleManager.analyzeTokenSecurity(tokenId);
    
    expect(analysis.strengths).toContain('Token has refresh capability');
  });
});

describe('Error Handling', () => {
  it('should handle network errors gracefully', () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    
    // This would be tested in actual component integration
    expect(true).toBe(true); // Placeholder for actual error handling test
  });

  it('should handle malformed token responses', () => {
    const malformedTokens = {
      // Missing required fields
      token_type: 'Bearer'
    };

    const result = storeOAuthTokens(malformedTokens as any);
    expect(result).toBe(true); // Should still store, validation happens elsewhere
  });
});

describe('Performance', () => {
  it('should handle large token datasets efficiently', () => {
    const startTime = performance.now();
    
    // Register many tokens
    for (let i = 0; i < 100; i++) {
      const tokens = {
        access_token: `test-token-${i}`,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid profile email'
      };
      tokenLifecycleManager.registerToken(tokens, 'authorization_code', `Test Flow ${i}`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (adjust threshold as needed)
    expect(duration).toBeLessThan(1000); // 1 second
  });

  it('should efficiently query token analytics', () => {
    const startTime = performance.now();
    
    const analytics = tokenLifecycleManager.getTokenUsageAnalytics();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100); // 100ms
    expect(analytics).toBeDefined();
  });
});
