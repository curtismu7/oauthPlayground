// Environment ID Persistence Service
// Manages saving/loading Environment ID to/from .env file

interface EnvironmentIdConfig {
  environmentId: string;
  lastUpdated: number;
  source: 'manual' | 'oidc_discovery' | 'env_file';
}

class EnvironmentIdPersistenceService {
  private readonly STORAGE_KEY = 'pingone_environment_id_persistence';
  private readonly ENV_VAR_NAME = 'REACT_APP_PINGONE_ENVIRONMENT_ID';

  // Safely read env vars in browser (Vite)
  private getEnvVar(name: string): string | undefined {
    try {
      // @ts-ignore - import.meta is a Vite construct; guarded access
      const meta: any = (import.meta as any);
      const env = meta && meta.env ? meta.env : undefined;
      if (env) {
        // Try exact name first
        if (env[name]) return String(env[name]);
        // Common alternates
        if (name === 'REACT_APP_PINGONE_ENVIRONMENT_ID') {
          if (env.VITE_PINGONE_ENVIRONMENT_ID) return String(env.VITE_PINGONE_ENVIRONMENT_ID);
        }
      }
    } catch {}
    return undefined;
  }

  /**
   * Save Environment ID to localStorage and optionally to .env
   */
  saveEnvironmentId(environmentId: string, source: 'manual' | 'oidc_discovery' = 'manual'): void {
    if (!environmentId || !environmentId.trim()) {
      console.warn('[EnvironmentIdPersistence] Cannot save empty environment ID');
      return;
    }

    const config: EnvironmentIdConfig = {
      environmentId: environmentId.trim(),
      lastUpdated: Date.now(),
      source
    };

    // Save to localStorage
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
      console.log(`🔧 [EnvironmentIdPersistence] Saved Environment ID: ${environmentId} (source: ${source})`);
    } catch (error) {
      console.error('[EnvironmentIdPersistence] Failed to save to localStorage:', error);
    }

    // In development, we can't directly write to .env, but we can provide instructions
    this.showEnvUpdateInstructions(environmentId);
  }

  /**
   * Load Environment ID from localStorage or .env
   */
  loadEnvironmentId(): string | null {
    // First try localStorage
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const config: EnvironmentIdConfig = JSON.parse(stored);
        console.log(`🔧 [EnvironmentIdPersistence] Loaded Environment ID from localStorage: ${config.environmentId}`);
        return config.environmentId;
      }
    } catch (error) {
      console.error('[EnvironmentIdPersistence] Failed to load from localStorage:', error);
    }

    // Fallback to environment variable (Vite/import.meta.env)
    const envId = this.getEnvVar(this.ENV_VAR_NAME);
    if (envId) {
      console.log(`🔧 [EnvironmentIdPersistence] Loaded Environment ID from .env: ${envId}`);
      // Save to localStorage for consistency
      this.saveEnvironmentId(envId, 'env_file');
      return envId;
    }

    console.log('[EnvironmentIdPersistence] No Environment ID found');
    return null;
  }

  /**
   * Get the last saved Environment ID info
   */
  getLastEnvironmentIdInfo(): EnvironmentIdConfig | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[EnvironmentIdPersistence] Failed to load info:', error);
    }
    return null;
  }

  /**
   * Check if Environment ID has changed and needs .env update
   */
  hasEnvironmentIdChanged(newEnvironmentId: string): boolean {
    const current = this.loadEnvironmentId();
    return current !== newEnvironmentId;
  }

  /**
   * Show instructions for updating .env file
   */
  private showEnvUpdateInstructions(environmentId: string): void {
    const instructions = `
🔧 Environment ID Update Required

The Environment ID has been updated to: ${environmentId}

To persist this change, add or update this line in your .env file:

REACT_APP_PINGONE_ENVIRONMENT_ID=${environmentId}

After updating .env:
1. Restart the development server
2. The Environment ID will be automatically loaded on next startup
    `;

    console.log(instructions);
    
    // Show a toast notification if available
    if (typeof window !== 'undefined' && (window as any).v4ToastManager) {
      (window as any).v4ToastManager.showInfo('Environment ID updated. Check console for .env update instructions.');
    }
  }

  /**
   * Generate .env content for the current Environment ID
   */
  generateEnvContent(): string {
    console.log('[EnvironmentIdPersistenceService] Generating .env content');
    const currentId = this.loadEnvironmentId();
    console.log('[EnvironmentIdPersistenceService] Current Environment ID:', currentId);
    if (!currentId) {
      console.log('[EnvironmentIdPersistenceService] No Environment ID found');
      return '# No Environment ID found\n';
    }

    const content = `# PingOne Environment ID
# Last updated: ${new Date().toISOString()}
REACT_APP_PINGONE_ENVIRONMENT_ID=${currentId}
`;
    console.log('[EnvironmentIdPersistenceService] Generated .env content:', content);
    return content;
  }

  /**
   * Generate .env content with newline (for appending to existing .env)
   */
  generateEnvContentWithNewline(): string {
    console.log('[EnvironmentIdPersistenceService] Generating .env content with newline');
    const content = this.generateEnvContent();
    console.log('[EnvironmentIdPersistenceService] Generated .env content with newline:', content);
    return content + '\n';
  }

  /**
   * Clear stored Environment ID
   */
  clearEnvironmentId(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('[EnvironmentIdPersistence] Cleared Environment ID from localStorage');
    } catch (error) {
      console.error('[EnvironmentIdPersistence] Failed to clear:', error);
    }
  }

  /**
   * Get persistence status
   */
  getPersistenceStatus(): {
    hasStoredId: boolean;
    hasEnvVar: boolean;
    lastUpdated: string | null;
    source: string | null;
  } {
    const info = this.getLastEnvironmentIdInfo();
    const envVar = this.getEnvVar(this.ENV_VAR_NAME);

    return {
      hasStoredId: !!info,
      hasEnvVar: !!envVar,
      lastUpdated: info ? new Date(info.lastUpdated).toISOString() : null,
      source: info?.source || null
    };
  }
}

// Export singleton instance
export const environmentIdPersistenceService = new EnvironmentIdPersistenceService();

// Export for global access in development
if (typeof window !== 'undefined') {
  (window as any).environmentIdPersistenceService = environmentIdPersistenceService;
  console.log('🔧 EnvironmentIdPersistenceService available globally as window.environmentIdPersistenceService');
}
