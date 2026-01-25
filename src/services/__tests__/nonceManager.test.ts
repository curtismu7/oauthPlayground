/**
 * NonceManager Tests
 * 
 * Test coverage:
 * - Nonce generation (cryptographically random)
 * - Store/retrieve/clear operations
 * - Validation (success and failure cases)
 * - Replay attack simulation
 * - One-time use enforcement
 * - sessionStorage usage
 */

import { NonceManager, createNonceManager } from '../nonceManager';

describe('NonceManager', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('Nonce generation', () => {
    it('should generate cryptographically random nonce', () => {
      const nonce1 = NonceManager.generate();
      const nonce2 = NonceManager.generate();

      expect(nonce1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(nonce2).toHaveLength(64);
      expect(nonce1).not.toBe(nonce2); // Should be different
    });

    it('should generate hex-encoded nonce', () => {
      const nonce = NonceManager.generate();
      expect(nonce).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique nonces', () => {
      const nonces = new Set<string>();
      for (let i = 0; i < 100; i++) {
        nonces.add(NonceManager.generate());
      }
      expect(nonces.size).toBe(100); // All unique
    });
  });

  describe('Store and retrieve', () => {
    it('should store and retrieve nonce', () => {
      const nonce = 'test-nonce-123';
      
      NonceManager.store(nonce, 'unified-oidc');
      const retrieved = NonceManager.retrieve('unified-oidc');

      expect(retrieved).toBe(nonce);
    });

    it('should return null for non-existent flow', () => {
      const retrieved = NonceManager.retrieve('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should store nonces for multiple flows independently', () => {
      NonceManager.store('nonce1', 'flow1');
      NonceManager.store('nonce2', 'flow2');

      expect(NonceManager.retrieve('flow1')).toBe('nonce1');
      expect(NonceManager.retrieve('flow2')).toBe('nonce2');
    });

    it('should use sessionStorage not localStorage', () => {
      const nonce = 'test-nonce';
      NonceManager.store(nonce, 'test-flow');

      expect(sessionStorage.getItem('oidc_nonce_test-flow')).toBe(nonce);
      expect(localStorage.getItem('oidc_nonce_test-flow')).toBeNull();
    });
  });

  describe('Clear', () => {
    it('should clear stored nonce', () => {
      NonceManager.store('test-nonce', 'unified-oidc');
      NonceManager.clear('unified-oidc');

      const retrieved = NonceManager.retrieve('unified-oidc');
      expect(retrieved).toBeNull();
    });

    it('should not affect other flows when clearing', () => {
      NonceManager.store('nonce1', 'flow1');
      NonceManager.store('nonce2', 'flow2');

      NonceManager.clear('flow1');

      expect(NonceManager.retrieve('flow1')).toBeNull();
      expect(NonceManager.retrieve('flow2')).toBe('nonce2');
    });
  });

  describe('Validation', () => {
    it('should validate matching nonce', () => {
      const nonce = NonceManager.generate();
      NonceManager.store(nonce, 'unified-oidc');

      const isValid = NonceManager.validate(nonce, 'unified-oidc');

      expect(isValid).toBe(true);
    });

    it('should reject mismatched nonce', () => {
      const nonce = NonceManager.generate();
      NonceManager.store(nonce, 'unified-oidc');

      const isValid = NonceManager.validate('wrong-nonce', 'unified-oidc');

      expect(isValid).toBe(false);
    });

    it('should reject validation when no nonce stored', () => {
      const isValid = NonceManager.validate('any-nonce', 'unified-oidc');

      expect(isValid).toBe(false);
    });

    it('should clear nonce after successful validation (one-time use)', () => {
      const nonce = NonceManager.generate();
      NonceManager.store(nonce, 'unified-oidc');

      NonceManager.validate(nonce, 'unified-oidc');

      const retrieved = NonceManager.retrieve('unified-oidc');
      expect(retrieved).toBeNull();
    });

    it('should not clear nonce after failed validation', () => {
      const nonce = NonceManager.generate();
      NonceManager.store(nonce, 'unified-oidc');

      NonceManager.validate('wrong-nonce', 'unified-oidc');

      const retrieved = NonceManager.retrieve('unified-oidc');
      expect(retrieved).toBe(nonce);
    });
  });

  describe('Replay attack simulation', () => {
    it('should prevent replay attack with same nonce', () => {
      const nonce = NonceManager.generate();
      NonceManager.store(nonce, 'unified-oidc');

      const firstValidation = NonceManager.validate(nonce, 'unified-oidc');
      const secondValidation = NonceManager.validate(nonce, 'unified-oidc');

      expect(firstValidation).toBe(true);
      expect(secondValidation).toBe(false); // Nonce cleared after first use
    });

    it('should prevent replay attack with forged nonce', () => {
      const legitimateNonce = NonceManager.generate();
      NonceManager.store(legitimateNonce, 'unified-oidc');

      const attackerNonce = 'attacker-forged-nonce';
      const isValid = NonceManager.validate(attackerNonce, 'unified-oidc');

      expect(isValid).toBe(false);
    });

    it('should prevent cross-flow nonce reuse', () => {
      const nonce = NonceManager.generate();
      NonceManager.store(nonce, 'flow1');

      const isValid = NonceManager.validate(nonce, 'flow2');

      expect(isValid).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle sessionStorage errors gracefully', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        NonceManager.store('nonce', 'flow');
      }).toThrow('Failed to store nonce parameter');

      Storage.prototype.setItem = originalSetItem;
    });

    it('should handle retrieval errors gracefully', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = NonceManager.retrieve('flow');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      Storage.prototype.getItem = originalGetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('Multiple instances', () => {
    it('should support multiple manager instances', () => {
      const manager1 = createNonceManager();
      const manager2 = createNonceManager();

      const nonce1 = manager1.generate();
      const nonce2 = manager2.generate();

      manager1.store(nonce1, 'flow1');
      manager2.store(nonce2, 'flow2');

      expect(manager1.validate(nonce1, 'flow1')).toBe(true);
      expect(manager2.validate(nonce2, 'flow2')).toBe(true);
    });
  });

  describe('Full OIDC flow simulation', () => {
    it('should handle complete OIDC authorization flow', () => {
      const nonce = NonceManager.generate();
      
      NonceManager.store(nonce, 'unified-oidc');
      
      const idTokenNonce = nonce;
      const isValid = NonceManager.validate(idTokenNonce, 'unified-oidc');
      
      expect(isValid).toBe(true);
      
      const afterValidation = NonceManager.retrieve('unified-oidc');
      expect(afterValidation).toBeNull();
    });

    it('should prevent ID token replay', () => {
      const nonce = NonceManager.generate();
      NonceManager.store(nonce, 'unified-oidc');

      NonceManager.validate(nonce, 'unified-oidc');

      const replayAttempt = NonceManager.validate(nonce, 'unified-oidc');
      expect(replayAttempt).toBe(false);
    });
  });

  describe('OIDC spec compliance', () => {
    it('should enforce one-time use per OIDC Core 1.0', () => {
      const nonce = NonceManager.generate();
      NonceManager.store(nonce, 'unified-oidc');

      const firstUse = NonceManager.validate(nonce, 'unified-oidc');
      expect(firstUse).toBe(true);

      const secondUse = NonceManager.validate(nonce, 'unified-oidc');
      expect(secondUse).toBe(false);
    });
  });
});
