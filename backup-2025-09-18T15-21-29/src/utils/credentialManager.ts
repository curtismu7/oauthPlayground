/* eslint-disable @typescript-eslint/no-unused-vars */
// src/utils/credentialManager.ts
import { logger } from './logger';

export interface PermanentCredentials {
  environmentId: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  authEndpoint?: string;
  tokenEndpoint?: string;
  userInfoEndpoint?: string;
  endSessionEndpoint?: string;
}

export interface SessionCredentials {
  clientSecret: string;
}

export interface AllCredentials extends PermanentCredentials {
  clientSecret: string; // Required in AllCredentials
}

export interface DiscoveryPreferences {
  environmentId: string;
  region: string;
  lastUpdated: number;
}

class CredentialManager {
  private readonly PERMANENT_CREDENTIALS_KEY = 'pingone_permanent_credentials';
  private readonly SESSION_CREDENTIALS_KEY = 'pingone_session_credentials';
  private readonly CONFIG_CREDENTIALS_KEY = 'pingone_config_credentials';
  private readonly AUTHZ_FLOW_CREDENTIALS_KEY = 'pingone_authz_flow_credentials';
  private readonly IMPLICIT_FLOW_CREDENTIALS_KEY = 'pingone_implicit_flow_credentials';
  private readonly DISCOVERY_PREFERENCES_KEY = 'pingone_discovery_preferences';
  private cache: { permanent?: PermanentCredentials; session?: SessionCredentials; all?: AllCredentials; timestamp?: number } = {};
  private readonly CACHE_DURATION = 5000; // 5 second cache

  /**
   * Invalidate cache when credentials are modified
   */
  private invalidateCache(): void {
    this.cache = {};
  }

  /**
   * Save configuration-specific credentials (from Configuration page)
   * These are separate from flow-specific credentials
   */
  saveConfigCredentials(credentials: Partial<PermanentCredentials>): boolean {
    try {
      const existing = this.loadConfigCredentials();
      const updated = {
        ...existing,
        ...credentials,
        lastUpdated: Date.now()
      };

      console.log('🔧 [CredentialManager] Saving config credentials to localStorage:', {
        key: this.CONFIG_CREDENTIALS_KEY,
        data: updated
      });

      localStorage.setItem(this.CONFIG_CREDENTIALS_KEY, JSON.stringify(updated));
      
      // Invalidate cache after saving
      this.invalidateCache();
      
      // Verify it was saved
      const saved = localStorage.getItem(this.CONFIG_CREDENTIALS_KEY);
      console.log('✅ [CredentialManager] Verified config credentials save:', saved);
      
      logger.success('CredentialManager', 'Saved config credentials', {
        hasEnvironmentId: !!updated.environmentId,
        hasClientId: !!updated.clientId,
        hasRedirectUri: !!updated.redirectUri
      });

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('config-credentials-changed', {
        detail: { credentials: updated }
      }));

      return true;
    } catch (_error) {
      logger.error('CredentialManager', 'Failed to save config credentials', String(_error));
      return false;
    }
  }

  /**
   * Load configuration-specific credentials
   */
  loadConfigCredentials(): PermanentCredentials {
    try {
      const stored = localStorage.getItem(this.CONFIG_CREDENTIALS_KEY);
      console.log('🔧 [CredentialManager] Loading config credentials from localStorage:', {
        key: this.CONFIG_CREDENTIALS_KEY,
        stored: stored
      });
      
      if (stored) {

        console.log('✅ [CredentialManager] Loaded config credentials from localStorage:', credentials);

        console.log('✅ [CredentialManager] Returning config credentials:', result);
        return result;
      } else {
        console.log('❌ [CredentialManager] No config credentials found');
        return {
          environmentId: '',
          clientId: '',
          redirectUri: window.location.origin + '/dashboard-callback',
          scopes: ['openid', 'profile', 'email']
        };
      }
    } catch (_error) {
      console.error('❌ [CredentialManager] Failed to load config credentials:', _error);
      logger.error('CredentialManager', 'Failed to load config credentials', String(_error));
      return {
        environmentId: '',
        clientId: '',
        redirectUri: window.location.origin + '/dashboard-callback',
        scopes: ['openid', 'profile', 'email']
      };
    }
  }

  /**
   * Save authorization flow-specific credentials (from Authorization Code flows)
   * These are separate from configuration credentials
   */
  saveAuthzFlowCredentials(credentials: Partial<PermanentCredentials>): boolean {
    try {
      const existing = this.loadAuthzFlowCredentials();
      const updated = {
        ...existing,
        ...credentials,
        lastUpdated: Date.now()
      };

      console.log('🔧 [CredentialManager] Saving authz flow credentials to localStorage:', {
        key: this.AUTHZ_FLOW_CREDENTIALS_KEY,
        data: updated
      });

      localStorage.setItem(this.AUTHZ_FLOW_CREDENTIALS_KEY, JSON.stringify(updated));
      
      // Invalidate cache after saving
      this.invalidateCache();
      
      // Verify it was saved
      const saved = localStorage.getItem(this.AUTHZ_FLOW_CREDENTIALS_KEY);
      console.log('✅ [CredentialManager] Verified authz flow credentials save:', saved);
      
      logger.success('CredentialManager', 'Saved authz flow credentials', {
        hasEnvironmentId: !!updated.environmentId,
        hasClientId: !!updated.clientId,
        hasRedirectUri: !!updated.redirectUri
      });

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('authz-flow-credentials-changed', {
        detail: { credentials: updated }
      }));

      return true;
    } catch (_error) {
      logger.error('CredentialManager', 'Failed to save authz flow credentials', error);
      return false;
    }
  }

  /**
   * Check if global config is enabled for credentials
   */
  private isGlobalConfigEnabled(): boolean {
    try {
      const configData = localStorage.getItem('pingone_config');
      if (configData) {

        return config.useGlobalConfig === true;
      }
    } catch (_error) {
      console.log('🔧 [CredentialManager] Could not check global config setting:', _error);
    }
    return false;
  }

  /**
   * Load authorization flow-specific credentials
   * If global config is enabled, returns Dashboard config credentials instead
   */
  loadAuthzFlowCredentials(): PermanentCredentials {
    try {
      // Check if global config is enabled - if so, use Dashboard credentials
      if (this.isGlobalConfigEnabled()) {
        console.log('🌐 [CredentialManager] Global config enabled - using Dashboard credentials for all flows');
        return this.loadConfigCredentials();
      }

      const stored = localStorage.getItem(this.AUTHZ_FLOW_CREDENTIALS_KEY);
      console.log('🔧 [CredentialManager] Loading authz flow credentials from localStorage:', {
        key: this.AUTHZ_FLOW_CREDENTIALS_KEY,
        stored: stored
      });
      
      if (stored) {

        console.log('✅ [CredentialManager] Loaded authz flow credentials from localStorage:', credentials);

        console.log('✅ [CredentialManager] Returning authz flow credentials:', result);
        return result;
      } else {
        console.log('❌ [CredentialManager] No authz flow credentials found');
        return {
          environmentId: '',
          clientId: '',
          clientSecret: '',
          redirectUri: window.location.origin + '/authz-callback',
          scopes: ['openid', 'profile', 'email']
        };
      }
    } catch (_error) {
      console.error('❌ [CredentialManager] Failed to load authz flow credentials:', _error);
      logger.error('CredentialManager', 'Failed to load authz flow credentials', String(_error));
      return {
        environmentId: '',
        clientId: '',
        clientSecret: '',
        redirectUri: window.location.origin + '/authz-callback',
        scopes: ['openid', 'profile', 'email']
      };
    }
  }

  /**
   * Save implicit flow-specific credentials (from Implicit flow)
   * These are separate from configuration and authz flow credentials
   */
  saveImplicitFlowCredentials(credentials: Partial<PermanentCredentials>): boolean {
    try {
      const existing = this.loadImplicitFlowCredentials();
      const updated = {
        ...existing,
        ...credentials,
        lastUpdated: Date.now()
      };

      console.log('🔧 [CredentialManager] Saving implicit flow credentials to localStorage:', {
        key: this.IMPLICIT_FLOW_CREDENTIALS_KEY,
        data: updated
      });

      localStorage.setItem(this.IMPLICIT_FLOW_CREDENTIALS_KEY, JSON.stringify(updated));
      this.invalidateCache();
      
      // Dispatch event to notify components of credential change
      window.dispatchEvent(new CustomEvent('implicit-flow-credentials-changed', { 
        detail: { credentials: updated } 
      }));
      
      console.log('✅ [CredentialManager] Successfully saved implicit flow credentials to localStorage');
      return true;
    } catch (_error) {
      console.error('❌ [CredentialManager] Error saving implicit flow credentials to localStorage:', _error);
      return false;
    }
  }

  /**
   * Load implicit flow-specific credentials
   */
  loadImplicitFlowCredentials(): PermanentCredentials {
    try {
      const stored = localStorage.getItem(this.IMPLICIT_FLOW_CREDENTIALS_KEY);
      console.log('🔧 [CredentialManager] Loading implicit flow credentials from localStorage:', {
        key: this.IMPLICIT_FLOW_CREDENTIALS_KEY,
        stored: stored
      });
      
      if (stored) {

        console.log('✅ [CredentialManager] Loaded implicit flow credentials from localStorage:', credentials);

        console.log('✅ [CredentialManager] Returning implicit flow credentials:', result);
        return result;
      } else {
        console.log('❌ [CredentialManager] No implicit flow credentials found');
        return {
          environmentId: '',
          clientId: '',
          clientSecret: '',
          redirectUri: window.location.origin + '/implicit-callback',
          scopes: ['openid', 'profile', 'email']
        };
      }
    } catch (_error) {
      console.error('❌ [CredentialManager] Failed to load implicit flow credentials:', _error);
      logger.error('CredentialManager', 'Failed to load implicit flow credentials', String(_error));
      return {
        environmentId: '',
        clientId: '',
        clientSecret: '',
        redirectUri: window.location.origin + '/implicit-callback',
        scopes: ['openid', 'profile', 'email']
      };
    }
  }

  /**
   * Save permanent credentials (Environment ID, Client ID, etc.)
   * These persist across browser refreshes and sessions
   * @deprecated Use saveConfigCredentials or saveAuthzFlowCredentials instead
   */
  savePermanentCredentials(credentials: Partial<PermanentCredentials>): boolean {
    try {
      const existing = this.loadPermanentCredentials();
      const updated = {
        ...existing,
        ...credentials,
        lastUpdated: Date.now()
      };

      console.log('🔧 [CredentialManager] Saving to localStorage:', {
        key: this.PERMANENT_CREDENTIALS_KEY,
        data: updated
      });

      localStorage.setItem(this.PERMANENT_CREDENTIALS_KEY, JSON.stringify(updated));
      
      // Invalidate cache after saving
      this.invalidateCache();
      
      // Verify it was saved
      const saved = localStorage.getItem(this.PERMANENT_CREDENTIALS_KEY);
      console.log('✅ [CredentialManager] Verified save:', saved);
      
      logger.success('CredentialManager', 'Saved permanent credentials', {
        hasEnvironmentId: !!updated.environmentId,
        hasClientId: !!updated.clientId,
        hasRedirectUri: !!updated.redirectUri
      });

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('permanent-credentials-changed', {
        detail: { credentials: updated }
      }));

      return true;
    } catch (_error) {
      logger.error('CredentialManager', 'Failed to save permanent credentials', error);
      return false;
    }
  }

  /**
   * Load permanent credentials from localStorage, with fallback to environment variables
   */
  loadPermanentCredentials(): PermanentCredentials {
    try {
      const stored = localStorage.getItem(this.PERMANENT_CREDENTIALS_KEY);
      console.log('🔧 [CredentialManager] Loading from localStorage:', {
        key: this.PERMANENT_CREDENTIALS_KEY,
        stored: stored,
        allKeys: Object.keys(localStorage).filter(key => key.includes('pingone'))
      });
      
      if (stored) {
        // Load from localStorage if available

        console.log('✅ [CredentialManager] Loaded from localStorage:', credentials);
        
        // Ensure required fields have defaults

        console.log('✅ [CredentialManager] Returning credentials:', result);
        return result;
      } else {
        // No localStorage found, return empty credentials
        // The async loading will be handled by loadPermanentCredentialsAsync
        console.log('❌ [CredentialManager] No stored credentials found');
        return {
          environmentId: '',
          clientId: '',
          redirectUri: window.location.origin + '/dashboard-callback',
          scopes: ['openid', 'profile', 'email']
        };
      }
    } catch (_error) {
      console.error('❌ [CredentialManager] Failed to load permanent credentials:', _error);
      logger.error('CredentialManager', 'Failed to load permanent credentials', error);
      return {
        environmentId: '',
        clientId: '',
        redirectUri: window.location.origin + '/dashboard-callback',
        scopes: ['openid', 'profile', 'email']
      };
    }
  }

  /**
   * Load permanent credentials asynchronously, with fallback to environment variables
   */
  async loadPermanentCredentialsAsync(): Promise<PermanentCredentials> {
    try {
      const stored = localStorage.getItem(this.PERMANENT_CREDENTIALS_KEY);
      console.log('🔧 [CredentialManager] Loading from localStorage (async):', {
        key: this.PERMANENT_CREDENTIALS_KEY,
        stored: stored,
        allKeys: Object.keys(localStorage).filter(key => key.includes('pingone'))
      });
      
      if (stored) {
        // Load from localStorage if available

        console.log('✅ [CredentialManager] Loaded from localStorage:', credentials);
        
        // Ensure required fields have defaults

        console.log('✅ [CredentialManager] Returning credentials:', result);
        return result;
      } else {
        // Fallback to environment variables
        console.log('🔄 [CredentialManager] No localStorage found, checking environment variables...');

        if (credentials.environmentId && credentials.clientId) {
          console.log('✅ [CredentialManager] Loaded from environment variables:', credentials);
          // Auto-save to localStorage for future use
          this.savePermanentCredentials(credentials);
        } else {
          console.log('❌ [CredentialManager] No credentials found in localStorage or environment');
        }
        
        return credentials;
      }
    } catch (_error) {
      console.error('❌ [CredentialManager] Failed to load permanent credentials:', _error);
      logger.error('CredentialManager', 'Failed to load permanent credentials', error);
      
      // Final fallback to environment variables
      return await this.loadFromEnvironmentVariables();
    }
  }

  /**
   * Load credentials from environment variables via API endpoint
   */
  private async loadFromEnvironmentVariables(): Promise<PermanentCredentials> {
    try {
      console.log('🔄 [CredentialManager] Fetching environment config from server...');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const envConfig = await response.json();
      console.log('✅ [CredentialManager] Loaded from environment config:', envConfig);
      
      return {
        environmentId: envConfig.environmentId || '',
        clientId: envConfig.clientId || '',
        redirectUri: envConfig.redirectUri || window.location.origin + '/dashboard-callback',
        scopes: envConfig.scopes || ['openid', 'profile', 'email'],
        authEndpoint: envConfig.authEndpoint,
        tokenEndpoint: envConfig.tokenEndpoint,
        userInfoEndpoint: envConfig.userInfoEndpoint,
        endSessionEndpoint: envConfig.endSessionEndpoint
      };
    } catch (_error) {
      console.error('❌ [CredentialManager] Failed to load from environment variables:', _error);
      return {
        environmentId: '',
        clientId: '',
        redirectUri: window.location.origin + '/dashboard-callback',
        scopes: ['openid', 'profile', 'email']
      };
    }
  }

  /**
   * Save session credentials (Client Secret)
   * These are NOT persisted across browser refreshes for security
   */
  saveSessionCredentials(credentials: Partial<SessionCredentials>): boolean {
    try {
      const existing = this.loadSessionCredentials();
      const updated = {
        ...existing,
        ...credentials
      };

      sessionStorage.setItem(this.SESSION_CREDENTIALS_KEY, JSON.stringify(updated));
      
      // Invalidate cache after saving
      this.invalidateCache();
      
      logger.success('CredentialManager', 'Saved session credentials', {
        hasClientSecret: !!updated.clientSecret
      });

      return true;
    } catch (_error) {
      logger.error('CredentialManager', 'Failed to save session credentials', error);
      return false;
    }
  }

  /**
   * Load session credentials
   */
  loadSessionCredentials(): SessionCredentials {
    try {
      const stored = sessionStorage.getItem(this.SESSION_CREDENTIALS_KEY);
      if (!stored) {
        return {
          clientSecret: ''
        };
      }

      return JSON.parse(stored);
    } catch (_error) {
      logger.error('CredentialManager', 'Failed to load session credentials', error);
      return {
        clientSecret: ''
      };
    }
  }

  /**
   * Get all credentials (permanent + session)
   */
  getAllCredentials(): AllCredentials {
    // Check cache first
    const now = Date.now();
    if (this.cache.all && this.cache.timestamp && (now - this.cache.timestamp) < this.CACHE_DURATION) {
      console.log('🔧 [CredentialManager] getAllCredentials - using cache');
      return this.cache.all;
    }

    const permanent = this.loadPermanentCredentials();
    const session = this.loadSessionCredentials();
    
    console.log('🔧 [CredentialManager] getAllCredentials - permanent:', permanent);
    console.log('🔧 [CredentialManager] getAllCredentials - session:', session);

    // Update cache
    this.cache.all = result;
    this.cache.timestamp = now;
    
    console.log('🔧 [CredentialManager] getAllCredentials - result:', result);
    return result;
  }

  /**
   * Get all credentials asynchronously (permanent + session)
   */
  async getAllCredentialsAsync(): Promise<AllCredentials> {
    const permanent = await this.loadPermanentCredentialsAsync();
    const session = this.loadSessionCredentials();
    
    console.log('🔧 [CredentialManager] getAllCredentialsAsync - permanent:', permanent);
    console.log('🔧 [CredentialManager] getAllCredentialsAsync - session:', session);

    console.log('🔧 [CredentialManager] getAllCredentialsAsync - result:', result);
    return result;
  }

  /**
   * Save all credentials (permanent + session)
   */
  saveAllCredentials(credentials: Partial<AllCredentials>): boolean {
    const permanentSuccess = this.savePermanentCredentials({
      environmentId: credentials.environmentId,
      clientId: credentials.clientId,
      redirectUri: credentials.redirectUri,
      scopes: credentials.scopes,
      authEndpoint: credentials.authEndpoint,
      tokenEndpoint: credentials.tokenEndpoint,
      userInfoEndpoint: credentials.userInfoEndpoint,
      endSessionEndpoint: credentials.endSessionEndpoint
    });

    const sessionSuccess = this.saveSessionCredentials({
      clientSecret: credentials.clientSecret
    });

    return permanentSuccess && sessionSuccess;
  }

  /**
   * Clear session credentials (Client Secret)
   * This should be called on logout or when security is needed
   */
  clearSessionCredentials(): boolean {
    try {
      sessionStorage.removeItem(this.SESSION_CREDENTIALS_KEY);
      logger.info('CredentialManager', 'Cleared session credentials');
      return true;
    } catch (_error) {
      logger.error('CredentialManager', 'Failed to clear session credentials', error);
      return false;
    }
  }

  /**
   * Clear all credentials (permanent + session)
   */
  clearAllCredentials(): boolean {
    try {
      localStorage.removeItem(this.PERMANENT_CREDENTIALS_KEY);
      sessionStorage.removeItem(this.SESSION_CREDENTIALS_KEY);
      logger.info('CredentialManager', 'Cleared all credentials');
      return true;
    } catch (_error) {
      logger.error('CredentialManager', 'Failed to clear all credentials', error);
      return false;
    }
  }

  /**
   * Check if permanent credentials are complete
   */
  arePermanentCredentialsComplete(): boolean {

    return !!(credentials.environmentId && credentials.clientId);
  }

  /**
   * Check if all credentials are complete
   */
  areAllCredentialsComplete(): boolean {

    return !!(credentials.environmentId && credentials.clientId && credentials.clientSecret);
  }

  /**
   * Get credentials status
   */
  getCredentialsStatus(): {
    permanent: 'complete' | 'partial' | 'missing';
    session: 'complete' | 'missing';
    overall: 'complete' | 'partial' | 'missing';
  } {
    const permanent = this.loadPermanentCredentials();
    const session = this.loadSessionCredentials();
    
    const permanentStatus = permanent.environmentId && permanent.clientId ? 'complete' : 
                           (permanent.environmentId || permanent.clientId) ? 'partial' : 'missing';
    
    const sessionStatus = session.clientSecret ? 'complete' : 'missing';
    
    const overallStatus = (permanentStatus === 'complete' && sessionStatus === 'complete') ? 'complete' :
                         (permanentStatus === 'complete' || permanentStatus === 'partial') ? 'partial' : 'missing';

    return {
      permanent: permanentStatus,
      session: sessionStatus,
      overall: overallStatus
    };
  }

  /**
   * Save discovery preferences (Environment ID and Region)
   */
  saveDiscoveryPreferences(preferences: Partial<DiscoveryPreferences>): boolean {
    try {
      const existing = this.loadDiscoveryPreferences();
      const updated: DiscoveryPreferences = {
        environmentId: preferences.environmentId || existing.environmentId || '',
        region: preferences.region || existing.region || 'us',
        lastUpdated: Date.now()
      };
      
      localStorage.setItem(this.DISCOVERY_PREFERENCES_KEY, JSON.stringify(updated));
      logger.info('Discovery preferences saved', `environmentId: ${updated.environmentId}, region: ${updated.region}`);
      return true;
    } catch (_error) {
      logger.error('Failed to save discovery preferences', String(_error));
      return false;
    }
  }

  /**
   * Load discovery preferences
   */
  loadDiscoveryPreferences(): DiscoveryPreferences {
    try {
      const stored = localStorage.getItem(this.DISCOVERY_PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          environmentId: parsed.environmentId || '',
          region: parsed.region || 'us',
          lastUpdated: parsed.lastUpdated || 0
        };
      }
    } catch (_error) {
      logger.error('Failed to load discovery preferences', String(_error));
    }
    
    return {
      environmentId: '',
      region: 'us',
      lastUpdated: 0
    };
  }

  /**
   * Debug method to check localStorage contents
   */
  debugLocalStorage(): void {
    console.log('🔍 [CredentialManager] Debug localStorage contents:');
    console.log('🔍 [CredentialManager] All localStorage keys:', Object.keys(localStorage));
    console.log('🔍 [CredentialManager] pingone_permanent_credentials:', localStorage.getItem('pingone_permanent_credentials'));
    console.log('🔍 [CredentialManager] pingone_session_credentials:', localStorage.getItem('pingone_session_credentials'));
    console.log('🔍 [CredentialManager] pingone_config_credentials:', localStorage.getItem('pingone_config_credentials'));
    console.log('🔍 [CredentialManager] pingone_authz_flow_credentials:', localStorage.getItem('pingone_authz_flow_credentials'));
    console.log('🔍 [CredentialManager] pingone_config:', localStorage.getItem('pingone_config'));
    console.log('🔍 [CredentialManager] login_credentials:', localStorage.getItem('login_credentials'));
  }

  /**
   * Clear the cache to force fresh data loading
   */
  clearCache(): void {
    this.cache = {
      permanent: null,
      session: null,
      all: null,
      timestamp: null
    };
    console.log('🧹 [CredentialManager] Cache cleared');
  }
}

// Export singleton instance
export const credentialManager = new CredentialManager();
