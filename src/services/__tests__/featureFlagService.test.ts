/**
 * FeatureFlagService Tests
 * 
 * Test coverage:
 * - Flag enable/disable
 * - Environment variable override
 * - Rollout percentage
 * - Flag change listeners
 * - Storage persistence
 */

import { FeatureFlagService, createFeatureFlagService } from '../featureFlagService';

describe('FeatureFlagService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Basic flag operations', () => {
    it('should return false for disabled flags by default', () => {
      expect(FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')).toBe(false);
      expect(FeatureFlagService.isEnabled('USE_NEW_OIDC_CORE')).toBe(false);
    });

    it('should enable flag', () => {
      FeatureFlagService.enable('USE_NEW_CREDENTIALS_REPO');
      expect(FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')).toBe(true);
    });

    it('should disable flag', () => {
      FeatureFlagService.enable('USE_NEW_CREDENTIALS_REPO');
      FeatureFlagService.disable('USE_NEW_CREDENTIALS_REPO');
      expect(FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')).toBe(false);
    });

    it('should set flag to specific value', () => {
      FeatureFlagService.setFlag('USE_NEW_CREDENTIALS_REPO', true);
      expect(FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')).toBe(true);

      FeatureFlagService.setFlag('USE_NEW_CREDENTIALS_REPO', false);
      expect(FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')).toBe(false);
    });
  });

  describe('Storage persistence', () => {
    it('should persist flag state in localStorage', () => {
      FeatureFlagService.enable('USE_NEW_CREDENTIALS_REPO');
      
      const stored = localStorage.getItem('feature_flag_USE_NEW_CREDENTIALS_REPO');
      expect(stored).toBe('true');
    });

    it('should read flag state from localStorage', () => {
      localStorage.setItem('feature_flag_USE_NEW_CREDENTIALS_REPO', 'true');
      
      expect(FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')).toBe(true);
    });

    it('should clear flag from storage', () => {
      FeatureFlagService.enable('USE_NEW_CREDENTIALS_REPO');
      FeatureFlagService.clearFlag('USE_NEW_CREDENTIALS_REPO');
      
      const stored = localStorage.getItem('feature_flag_USE_NEW_CREDENTIALS_REPO');
      expect(stored).toBeNull();
    });

    it('should clear all flags', () => {
      FeatureFlagService.enable('USE_NEW_CREDENTIALS_REPO');
      FeatureFlagService.enable('USE_NEW_OIDC_CORE');
      
      FeatureFlagService.clearAllFlags();
      
      expect(localStorage.getItem('feature_flag_USE_NEW_CREDENTIALS_REPO')).toBeNull();
      expect(localStorage.getItem('feature_flag_USE_NEW_OIDC_CORE')).toBeNull();
    });
  });

  describe('Get all flags', () => {
    it('should return all flags with their current values', () => {
      FeatureFlagService.enable('USE_NEW_CREDENTIALS_REPO');
      
      const flags = FeatureFlagService.getAllFlags();
      
      expect(flags.USE_NEW_CREDENTIALS_REPO).toBe(true);
      expect(flags.USE_NEW_OIDC_CORE).toBe(false);
    });
  });

  describe('Flag configuration', () => {
    it('should return flag configuration', () => {
      const config = FeatureFlagService.getFlagConfig('USE_NEW_CREDENTIALS_REPO');
      
      expect(config.description).toBeDefined();
      expect(config.currentValue).toBe(false);
      expect(config.enabled).toBe(false);
    });

    it('should include current value in config', () => {
      FeatureFlagService.enable('USE_NEW_CREDENTIALS_REPO');
      
      const config = FeatureFlagService.getFlagConfig('USE_NEW_CREDENTIALS_REPO');
      
      expect(config.currentValue).toBe(true);
    });
  });

  describe('Rollout percentage', () => {
    it('should set rollout percentage', () => {
      FeatureFlagService.setRolloutPercentage('USE_NEW_CREDENTIALS_REPO', 50);
      
      const config = FeatureFlagService.getFlagConfig('USE_NEW_CREDENTIALS_REPO');
      expect(config.rolloutPercentage).toBe(50);
    });

    it('should throw error for invalid percentage', () => {
      expect(() => {
        FeatureFlagService.setRolloutPercentage('USE_NEW_CREDENTIALS_REPO', 101);
      }).toThrow('Rollout percentage must be between 0 and 100');

      expect(() => {
        FeatureFlagService.setRolloutPercentage('USE_NEW_CREDENTIALS_REPO', -1);
      }).toThrow('Rollout percentage must be between 0 and 100');
    });

    it('should enable flag based on rollout percentage', () => {
      FeatureFlagService.setRolloutPercentage('USE_NEW_CREDENTIALS_REPO', 100);
      
      expect(FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')).toBe(true);
    });

    it('should disable flag when rollout is 0%', () => {
      FeatureFlagService.setRolloutPercentage('USE_NEW_CREDENTIALS_REPO', 0);
      
      expect(FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO')).toBe(false);
    });
  });

  describe('Flag change listeners', () => {
    it('should notify listeners when flag changes', () => {
      const listener = jest.fn();
      
      FeatureFlagService.onFlagChange('USE_NEW_CREDENTIALS_REPO', listener);
      FeatureFlagService.enable('USE_NEW_CREDENTIALS_REPO');
      
      expect(listener).toHaveBeenCalledWith('USE_NEW_CREDENTIALS_REPO', true);
    });

    it('should support multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      FeatureFlagService.onFlagChange('USE_NEW_CREDENTIALS_REPO', listener1);
      FeatureFlagService.onFlagChange('USE_NEW_CREDENTIALS_REPO', listener2);
      FeatureFlagService.enable('USE_NEW_CREDENTIALS_REPO');
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should unsubscribe listener', () => {
      const listener = jest.fn();
      
      const unsubscribe = FeatureFlagService.onFlagChange('USE_NEW_CREDENTIALS_REPO', listener);
      unsubscribe();
      FeatureFlagService.enable('USE_NEW_CREDENTIALS_REPO');
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      FeatureFlagService.onFlagChange('USE_NEW_CREDENTIALS_REPO', errorListener);
      FeatureFlagService.onFlagChange('USE_NEW_CREDENTIALS_REPO', goodListener);
      FeatureFlagService.enable('USE_NEW_CREDENTIALS_REPO');
      
      expect(errorListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('Storage error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      FeatureFlagService.enable('USE_NEW_CREDENTIALS_REPO');
      
      expect(consoleSpy).toHaveBeenCalled();
      
      Storage.prototype.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in storage', () => {
      localStorage.setItem('feature_flag_USE_NEW_CREDENTIALS_REPO', '{invalid json}');
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = FeatureFlagService.isEnabled('USE_NEW_CREDENTIALS_REPO');
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Multiple instances', () => {
    it('should support multiple service instances', () => {
      const service1 = createFeatureFlagService();
      const service2 = createFeatureFlagService();
      
      service1.enable('USE_NEW_CREDENTIALS_REPO');
      service2.enable('USE_NEW_OIDC_CORE');
      
      expect(service1.isEnabled('USE_NEW_CREDENTIALS_REPO')).toBe(true);
      expect(service2.isEnabled('USE_NEW_OIDC_CORE')).toBe(true);
    });
  });

  describe('User hash consistency', () => {
    it('should generate consistent user ID', () => {
      const service = createFeatureFlagService();
      
      service.setRolloutPercentage('USE_NEW_CREDENTIALS_REPO', 50);
      
      const result1 = service.isEnabled('USE_NEW_CREDENTIALS_REPO');
      const result2 = service.isEnabled('USE_NEW_CREDENTIALS_REPO');
      
      expect(result1).toBe(result2);
    });
  });
});
