/**
 * PkceManager Tests
 * 
 * Test coverage:
 * - PKCE generation (code verifier + challenge)
 * - SHA-256 challenge generation
 * - Store/retrieve/clear operations
 * - Base64 URL encoding
 * - sessionStorage usage
 * - RFC 7636 compliance
 */

import { PkceManager, createPkceManager } from '../pkceManager';

describe('PkceManager', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('PKCE generation', () => {
    it('should generate code verifier and challenge', async () => {
      const pkce = await PkceManager.generateAsync();

      expect(pkce.codeVerifier).toBeDefined();
      expect(pkce.codeChallenge).toBeDefined();
      expect(pkce.codeChallengeMethod).toBe('S256');
    });

    it('should generate base64url-encoded code verifier', async () => {
      const pkce = await PkceManager.generateAsync();

      expect(pkce.codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
    });

    it('should generate base64url-encoded code challenge', async () => {
      const pkce = await PkceManager.generateAsync();

      expect(pkce.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(pkce.codeChallenge.length).toBeGreaterThanOrEqual(43);
    });

    it('should generate unique code verifiers', async () => {
      const pkce1 = await PkceManager.generateAsync();
      const pkce2 = await PkceManager.generateAsync();

      expect(pkce1.codeVerifier).not.toBe(pkce2.codeVerifier);
      expect(pkce1.codeChallenge).not.toBe(pkce2.codeChallenge);
    });

    it('should generate different challenge for different verifier', async () => {
      const pkce1 = await PkceManager.generateAsync();
      const pkce2 = await PkceManager.generateAsync();

      expect(pkce1.codeChallenge).not.toBe(pkce2.codeChallenge);
    });
  });

  describe('Store and retrieve', () => {
    it('should store and retrieve PKCE codes', async () => {
      const pkce = await PkceManager.generateAsync();
      
      PkceManager.store(pkce, 'unified-oauth');
      const retrieved = PkceManager.retrieve('unified-oauth');

      expect(retrieved).toEqual(pkce);
    });

    it('should return null for non-existent flow', () => {
      const retrieved = PkceManager.retrieve('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should store PKCE codes for multiple flows independently', async () => {
      const pkce1 = await PkceManager.generateAsync();
      const pkce2 = await PkceManager.generateAsync();

      PkceManager.store(pkce1, 'flow1');
      PkceManager.store(pkce2, 'flow2');

      expect(PkceManager.retrieve('flow1')).toEqual(pkce1);
      expect(PkceManager.retrieve('flow2')).toEqual(pkce2);
    });

    it('should use sessionStorage not localStorage', async () => {
      const pkce = await PkceManager.generateAsync();
      PkceManager.store(pkce, 'test-flow');

      const stored = sessionStorage.getItem('pkce_test-flow');
      expect(stored).toBeDefined();
      expect(localStorage.getItem('pkce_test-flow')).toBeNull();
    });
  });

  describe('Clear', () => {
    it('should clear stored PKCE codes', async () => {
      const pkce = await PkceManager.generateAsync();
      
      PkceManager.store(pkce, 'unified-oauth');
      PkceManager.clear('unified-oauth');

      const retrieved = PkceManager.retrieve('unified-oauth');
      expect(retrieved).toBeNull();
    });

    it('should not affect other flows when clearing', async () => {
      const pkce1 = await PkceManager.generateAsync();
      const pkce2 = await PkceManager.generateAsync();

      PkceManager.store(pkce1, 'flow1');
      PkceManager.store(pkce2, 'flow2');

      PkceManager.clear('flow1');

      expect(PkceManager.retrieve('flow1')).toBeNull();
      expect(PkceManager.retrieve('flow2')).toEqual(pkce2);
    });
  });

  describe('Error handling', () => {
    it('should handle sessionStorage errors gracefully', async () => {
      const pkce = await PkceManager.generateAsync();
      const originalSetItem = Storage.prototype.setItem;
      
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        PkceManager.store(pkce, 'flow');
      }).toThrow('Failed to store PKCE codes');

      Storage.prototype.setItem = originalSetItem;
    });

    it('should handle retrieval errors gracefully', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = PkceManager.retrieve('flow');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      Storage.prototype.getItem = originalGetItem;
      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in storage', () => {
      sessionStorage.setItem('pkce_test-flow', '{invalid json}');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = PkceManager.retrieve('test-flow');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Multiple instances', () => {
    it('should support multiple manager instances', async () => {
      const manager1 = createPkceManager();
      const manager2 = createPkceManager();

      const pkce1 = await manager1.generateAsync();
      const pkce2 = await manager2.generateAsync();

      manager1.store(pkce1, 'flow1');
      manager2.store(pkce2, 'flow2');

      expect(manager1.retrieve('flow1')).toEqual(pkce1);
      expect(manager2.retrieve('flow2')).toEqual(pkce2);
    });
  });

  describe('Full OAuth flow simulation', () => {
    it('should handle complete PKCE flow', async () => {
      const pkce = await PkceManager.generateAsync();
      
      PkceManager.store(pkce, 'unified-oauth');
      
      const authUrl = `https://auth.example.com/authorize?code_challenge=${pkce.codeChallenge}&code_challenge_method=S256`;
      expect(authUrl).toContain(pkce.codeChallenge);
      
      const retrieved = PkceManager.retrieve('unified-oauth');
      expect(retrieved?.codeVerifier).toBe(pkce.codeVerifier);
      
      PkceManager.clear('unified-oauth');
      
      const afterClear = PkceManager.retrieve('unified-oauth');
      expect(afterClear).toBeNull();
    });
  });

  describe('RFC 7636 compliance', () => {
    it('should use S256 challenge method', async () => {
      const pkce = await PkceManager.generateAsync();
      expect(pkce.codeChallengeMethod).toBe('S256');
    });

    it('should generate code verifier with sufficient entropy', async () => {
      const pkce = await PkceManager.generateAsync();
      expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
    });

    it('should use base64url encoding (no padding)', async () => {
      const pkce = await PkceManager.generateAsync();
      
      expect(pkce.codeVerifier).not.toContain('=');
      expect(pkce.codeVerifier).not.toContain('+');
      expect(pkce.codeVerifier).not.toContain('/');
      
      expect(pkce.codeChallenge).not.toContain('=');
      expect(pkce.codeChallenge).not.toContain('+');
      expect(pkce.codeChallenge).not.toContain('/');
    });
  });

  describe('SHA-256 challenge generation', () => {
    it('should generate different challenges for different verifiers', async () => {
      const manager = createPkceManager();
      
      const pkce1 = await manager.generateAsync();
      const pkce2 = await manager.generateAsync();
      
      expect(pkce1.codeChallenge).not.toBe(pkce2.codeChallenge);
    });
  });
});
