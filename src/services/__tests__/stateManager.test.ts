/**
 * StateManager Tests
 * 
 * Test coverage:
 * - State generation (cryptographically random)
 * - Store/retrieve/clear operations
 * - Validation (success and failure cases)
 * - CSRF attack simulation
 * - sessionStorage usage
 */

import { StateManager, createStateManager } from '../stateManager';

describe('StateManager', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('State generation', () => {
    it('should generate cryptographically random state', () => {
      const state1 = StateManager.generate();
      const state2 = StateManager.generate();

      expect(state1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(state2).toHaveLength(64);
      expect(state1).not.toBe(state2); // Should be different
    });

    it('should generate hex-encoded state', () => {
      const state = StateManager.generate();
      expect(state).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique states', () => {
      const states = new Set<string>();
      for (let i = 0; i < 100; i++) {
        states.add(StateManager.generate());
      }
      expect(states.size).toBe(100); // All unique
    });
  });

  describe('Store and retrieve', () => {
    it('should store and retrieve state', () => {
      const state = 'test-state-123';
      
      StateManager.store(state, 'unified-oauth');
      const retrieved = StateManager.retrieve('unified-oauth');

      expect(retrieved).toBe(state);
    });

    it('should return null for non-existent flow', () => {
      const retrieved = StateManager.retrieve('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should store states for multiple flows independently', () => {
      StateManager.store('state1', 'flow1');
      StateManager.store('state2', 'flow2');

      expect(StateManager.retrieve('flow1')).toBe('state1');
      expect(StateManager.retrieve('flow2')).toBe('state2');
    });

    it('should use sessionStorage not localStorage', () => {
      const state = 'test-state';
      StateManager.store(state, 'test-flow');

      expect(sessionStorage.getItem('oauth_state_test-flow')).toBe(state);
      expect(localStorage.getItem('oauth_state_test-flow')).toBeNull();
    });
  });

  describe('Clear', () => {
    it('should clear stored state', () => {
      StateManager.store('test-state', 'unified-oauth');
      StateManager.clear('unified-oauth');

      const retrieved = StateManager.retrieve('unified-oauth');
      expect(retrieved).toBeNull();
    });

    it('should not affect other flows when clearing', () => {
      StateManager.store('state1', 'flow1');
      StateManager.store('state2', 'flow2');

      StateManager.clear('flow1');

      expect(StateManager.retrieve('flow1')).toBeNull();
      expect(StateManager.retrieve('flow2')).toBe('state2');
    });
  });

  describe('Validation', () => {
    it('should validate matching state', () => {
      const state = StateManager.generate();
      StateManager.store(state, 'unified-oauth');

      const isValid = StateManager.validate(state, 'unified-oauth');

      expect(isValid).toBe(true);
    });

    it('should reject mismatched state', () => {
      const state = StateManager.generate();
      StateManager.store(state, 'unified-oauth');

      const isValid = StateManager.validate('wrong-state', 'unified-oauth');

      expect(isValid).toBe(false);
    });

    it('should reject validation when no state stored', () => {
      const isValid = StateManager.validate('any-state', 'unified-oauth');

      expect(isValid).toBe(false);
    });

    it('should clear state after successful validation', () => {
      const state = StateManager.generate();
      StateManager.store(state, 'unified-oauth');

      StateManager.validate(state, 'unified-oauth');

      const retrieved = StateManager.retrieve('unified-oauth');
      expect(retrieved).toBeNull();
    });

    it('should not clear state after failed validation', () => {
      const state = StateManager.generate();
      StateManager.store(state, 'unified-oauth');

      StateManager.validate('wrong-state', 'unified-oauth');

      const retrieved = StateManager.retrieve('unified-oauth');
      expect(retrieved).toBe(state);
    });
  });

  describe('CSRF attack simulation', () => {
    it('should prevent CSRF attack with forged state', () => {
      const legitimateState = StateManager.generate();
      StateManager.store(legitimateState, 'unified-oauth');

      const attackerState = 'attacker-forged-state';
      const isValid = StateManager.validate(attackerState, 'unified-oauth');

      expect(isValid).toBe(false);
    });

    it('should prevent replay attack', () => {
      const state = StateManager.generate();
      StateManager.store(state, 'unified-oauth');

      const firstValidation = StateManager.validate(state, 'unified-oauth');
      const secondValidation = StateManager.validate(state, 'unified-oauth');

      expect(firstValidation).toBe(true);
      expect(secondValidation).toBe(false); // State cleared after first use
    });

    it('should prevent cross-flow state reuse', () => {
      const state = StateManager.generate();
      StateManager.store(state, 'flow1');

      const isValid = StateManager.validate(state, 'flow2');

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
        StateManager.store('state', 'flow');
      }).toThrow('Failed to store state parameter');

      Storage.prototype.setItem = originalSetItem;
    });

    it('should handle retrieval errors gracefully', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = StateManager.retrieve('flow');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      Storage.prototype.getItem = originalGetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('Multiple instances', () => {
    it('should support multiple manager instances', () => {
      const manager1 = createStateManager();
      const manager2 = createStateManager();

      const state1 = manager1.generate();
      const state2 = manager2.generate();

      manager1.store(state1, 'flow1');
      manager2.store(state2, 'flow2');

      expect(manager1.validate(state1, 'flow1')).toBe(true);
      expect(manager2.validate(state2, 'flow2')).toBe(true);
    });
  });

  describe('Full OAuth flow simulation', () => {
    it('should handle complete authorization flow', () => {
      const state = StateManager.generate();
      
      StateManager.store(state, 'unified-oauth');
      
      const callbackState = state;
      const isValid = StateManager.validate(callbackState, 'unified-oauth');
      
      expect(isValid).toBe(true);
      
      const afterValidation = StateManager.retrieve('unified-oauth');
      expect(afterValidation).toBeNull();
    });
  });
});
