// src/utils/credentialManager.ts
import { logger } from './logger';

export interface PermanentCredentials {
  environmentId: string;
  clientId: string;
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

export interface AllCredentials extends PermanentCredentials, SessionCredentials {}

class CredentialManager {
  private readonly PERMANENT_CREDENTIALS_KEY = 'pingone_permanent_credentials';
  private readonly SESSION_CREDENTIALS_KEY = 'pingone_session_credentials';

  /**
   * Save permanent credentials (Environment ID, Client ID, etc.)
   * These persist across browser refreshes and sessions
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
    } catch (error) {
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
        const credentials = JSON.parse(stored);
        console.log('✅ [CredentialManager] Loaded from localStorage:', credentials);
        
        // Ensure required fields have defaults
        const result = {
          environmentId: credentials.environmentId || '',
          clientId: credentials.clientId || '',
          redirectUri: credentials.redirectUri || window.location.origin + '/dashboard-callback',
          scopes: credentials.scopes || ['openid', 'profile', 'email'],
          authEndpoint: credentials.authEndpoint,
          tokenEndpoint: credentials.tokenEndpoint,
          userInfoEndpoint: credentials.userInfoEndpoint,
          endSessionEndpoint: credentials.endSessionEndpoint
        };
        
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
    } catch (error) {
      console.error('❌ [CredentialManager] Failed to load permanent credentials:', error);
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
        const credentials = JSON.parse(stored);
        console.log('✅ [CredentialManager] Loaded from localStorage:', credentials);
        
        // Ensure required fields have defaults
        const result = {
          environmentId: credentials.environmentId || '',
          clientId: credentials.clientId || '',
          redirectUri: credentials.redirectUri || window.location.origin + '/dashboard-callback',
          scopes: credentials.scopes || ['openid', 'profile', 'email'],
          authEndpoint: credentials.authEndpoint,
          tokenEndpoint: credentials.tokenEndpoint,
          userInfoEndpoint: credentials.userInfoEndpoint,
          endSessionEndpoint: credentials.endSessionEndpoint
        };
        
        console.log('✅ [CredentialManager] Returning credentials:', result);
        return result;
      } else {
        // Fallback to environment variables
        console.log('🔄 [CredentialManager] No localStorage found, checking environment variables...');
        const credentials = await this.loadFromEnvironmentVariables();
        
        if (credentials.environmentId && credentials.clientId) {
          console.log('✅ [CredentialManager] Loaded from environment variables:', credentials);
          // Auto-save to localStorage for future use
          this.savePermanentCredentials(credentials);
        } else {
          console.log('❌ [CredentialManager] No credentials found in localStorage or environment');
        }
        
        return credentials;
      }
    } catch (error) {
      console.error('❌ [CredentialManager] Failed to load permanent credentials:', error);
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
      
      const response = await fetch('/api/env-config');
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
    } catch (error) {
      console.error('❌ [CredentialManager] Failed to load from environment variables:', error);
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
      
      logger.success('CredentialManager', 'Saved session credentials', {
        hasClientSecret: !!updated.clientSecret
      });

      return true;
    } catch (error) {
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
    } catch (error) {
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
    const permanent = this.loadPermanentCredentials();
    const session = this.loadSessionCredentials();
    
    console.log('🔧 [CredentialManager] getAllCredentials - permanent:', permanent);
    console.log('🔧 [CredentialManager] getAllCredentials - session:', session);
    
    const result = {
      ...permanent,
      ...session
    };
    
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
    
    const result = {
      ...permanent,
      ...session
    };
    
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
    } catch (error) {
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
    } catch (error) {
      logger.error('CredentialManager', 'Failed to clear all credentials', error);
      return false;
    }
  }

  /**
   * Check if permanent credentials are complete
   */
  arePermanentCredentialsComplete(): boolean {
    const credentials = this.loadPermanentCredentials();
    return !!(credentials.environmentId && credentials.clientId);
  }

  /**
   * Check if all credentials are complete
   */
  areAllCredentialsComplete(): boolean {
    const credentials = this.getAllCredentials();
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
   * Debug method to check localStorage contents
   */
  debugLocalStorage(): void {
    console.log('🔍 [CredentialManager] Debug localStorage contents:');
    console.log('🔍 [CredentialManager] All localStorage keys:', Object.keys(localStorage));
    console.log('🔍 [CredentialManager] pingone_permanent_credentials:', localStorage.getItem('pingone_permanent_credentials'));
    console.log('🔍 [CredentialManager] pingone_session_credentials:', localStorage.getItem('pingone_session_credentials'));
    console.log('🔍 [CredentialManager] pingone_config:', localStorage.getItem('pingone_config'));
    console.log('🔍 [CredentialManager] login_credentials:', localStorage.getItem('login_credentials'));
  }
}

// Export singleton instance
export const credentialManager = new CredentialManager();

// Export types for use in components
export type { PermanentCredentials, SessionCredentials, AllCredentials };
