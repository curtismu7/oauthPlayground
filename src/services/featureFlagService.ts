/**
 * FeatureFlagService - Feature flag management for gradual rollout
 * 
 * Features:
 * - localStorage-based flags with environment variable override
 * - Gradual rollout support (percentage-based)
 * - Flag change listeners
 * - Admin UI toggle support
 * 
 * Flags:
 * - USE_NEW_CREDENTIALS_REPO: Phase 1 credentials migration
 * - USE_NEW_OIDC_CORE: Phase 2 OIDC security services
 */

export type FeatureFlag = 
  | 'USE_NEW_CREDENTIALS_REPO'
  | 'USE_NEW_OIDC_CORE';

interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number;
  description: string;
}

type FlagChangeListener = (flag: FeatureFlag, enabled: boolean) => void;

class FeatureFlagServiceImpl {
  private storagePrefix = 'feature_flag_';
  private listeners = new Map<FeatureFlag, Set<FlagChangeListener>>();
  private userHash: number | null = null;

  private defaultFlags: Record<FeatureFlag, FeatureFlagConfig> = {
    USE_NEW_CREDENTIALS_REPO: {
      enabled: false,
      rolloutPercentage: 0,
      description: 'Use new CredentialsRepository (consolidates 4 services)',
    },
    USE_NEW_OIDC_CORE: {
      enabled: false,
      rolloutPercentage: 0,
      description: 'Use new OIDC core services (State/Nonce/PKCE managers)',
    },
  };

  isEnabled(flag: FeatureFlag): boolean {
    const envOverride = this.getEnvironmentOverride(flag);
    if (envOverride !== null) {
      return envOverride;
    }

    const storedValue = this.getStoredValue(flag);
    if (storedValue !== null) {
      return storedValue;
    }

    const config = this.defaultFlags[flag];
    
    if (config.rolloutPercentage && config.rolloutPercentage > 0) {
      return this.isInRollout(flag, config.rolloutPercentage);
    }

    return config.enabled;
  }

  enable(flag: FeatureFlag): void {
    this.setFlag(flag, true);
  }

  disable(flag: FeatureFlag): void {
    this.setFlag(flag, false);
  }

  setFlag(flag: FeatureFlag, enabled: boolean): void {
    const key = this.getStorageKey(flag);
    
    try {
      localStorage.setItem(key, JSON.stringify(enabled));
      console.log(`[FeatureFlagService] Set ${flag} to ${enabled}`);
      this.notifyListeners(flag, enabled);
    } catch (error) {
      console.error(`[FeatureFlagService] Error setting flag ${flag}:`, error);
    }
  }

  setRolloutPercentage(flag: FeatureFlag, percentage: number): void {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }

    this.defaultFlags[flag].rolloutPercentage = percentage;
    console.log(`[FeatureFlagService] Set ${flag} rollout to ${percentage}%`);
  }

  getAllFlags(): Record<FeatureFlag, boolean> {
    const flags: Partial<Record<FeatureFlag, boolean>> = {};
    
    for (const flag of Object.keys(this.defaultFlags) as FeatureFlag[]) {
      flags[flag] = this.isEnabled(flag);
    }
    
    return flags as Record<FeatureFlag, boolean>;
  }

  getFlagConfig(flag: FeatureFlag): FeatureFlagConfig & { currentValue: boolean } {
    return {
      ...this.defaultFlags[flag],
      currentValue: this.isEnabled(flag),
    };
  }

  clearFlag(flag: FeatureFlag): void {
    const key = this.getStorageKey(flag);
    
    try {
      localStorage.removeItem(key);
      console.log(`[FeatureFlagService] Cleared ${flag}`);
      this.notifyListeners(flag, this.isEnabled(flag));
    } catch (error) {
      console.error(`[FeatureFlagService] Error clearing flag ${flag}:`, error);
    }
  }

  clearAllFlags(): void {
    for (const flag of Object.keys(this.defaultFlags) as FeatureFlag[]) {
      this.clearFlag(flag);
    }
  }

  onFlagChange(flag: FeatureFlag, callback: FlagChangeListener): () => void {
    if (!this.listeners.has(flag)) {
      this.listeners.set(flag, new Set());
    }
    
    this.listeners.get(flag)!.add(callback);
    
    return () => {
      this.listeners.get(flag)?.delete(callback);
    };
  }

  private getEnvironmentOverride(flag: FeatureFlag): boolean | null {
    if (typeof process !== 'undefined' && process.env) {
      const value = process.env[flag];
      if (value === 'true') return true;
      if (value === 'false') return false;
    }
    return null;
  }

  private getStoredValue(flag: FeatureFlag): boolean | null {
    const key = this.getStorageKey(flag);
    
    try {
      const value = localStorage.getItem(key);
      if (value === null) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error(`[FeatureFlagService] Error reading flag ${flag}:`, error);
      return null;
    }
  }

  private isInRollout(_flag: FeatureFlag, percentage: number): boolean {
    const hash = this.getUserHash();
    const bucket = hash % 100;
    return bucket < percentage;
  }

  private getUserHash(): number {
    if (this.userHash !== null) {
      return this.userHash;
    }

    let userId = localStorage.getItem('user_id');
    
    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem('user_id', userId);
    }

    this.userHash = this.hashString(userId);
    return this.userHash;
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private notifyListeners(flag: FeatureFlag, enabled: boolean): void {
    const listeners = this.listeners.get(flag);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(flag, enabled);
        } catch (error) {
          console.error(`[FeatureFlagService] Error in listener for ${flag}:`, error);
        }
      });
    }
  }

  private getStorageKey(flag: FeatureFlag): string {
    return `${this.storagePrefix}${flag}`;
  }
}

export const FeatureFlagService = new FeatureFlagServiceImpl();

export function createFeatureFlagService(): FeatureFlagServiceImpl {
  return new FeatureFlagServiceImpl();
}
