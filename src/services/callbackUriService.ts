/**
 * Centralized Callback URI Management Service
 * 
 * This service provides dynamic, environment-aware callback URI management
 * to eliminate hardcoded localhost URLs and ensure proper flow-specific routing.
 */

export interface CallbackUriConfig {
  /** Base origin (e.g., 'https://localhost:3000' or 'https://production.com') */
  origin: string;
  /** Environment-specific overrides */
  environment?: 'development' | 'staging' | 'production';
  /** Custom callback paths */
  customPaths?: Record<string, string>;
}

export interface FlowCallbackUris {
  /** Authorization code flow callback */
  authzCallback: string;
  /** Implicit flow callback */
  implicitCallback: string;
  /** Logout callback */
  logoutCallback: string;
  /** Hybrid flow callback */
  hybridCallback: string;
  /** OAuth V3 callback */
  oauthV3Callback: string;
  /** Worker token callback */
  workerTokenCallback: string;
  /** Device code status callback */
  deviceCodeCallback: string;
  /** Dashboard callback */
  dashboardCallback: string;
  /** PingOne Authentication callback */
  p1authCallback: string;
  /** Authorization code flow logout callback */
  authzLogoutCallback: string;
  /** Implicit flow logout callback */
  implicitLogoutCallback: string;
  /** Hybrid flow logout callback */
  hybridLogoutCallback: string;
  /** Device flow logout callback */
  deviceLogoutCallback: string;
  /** Worker token flow logout callback */
  workerTokenLogoutCallback: string;
  /** PingOne Authentication logout callback */
  p1authLogoutCallback: string;
  /** Dashboard logout callback */
  dashboardLogoutCallback: string;
}

class CallbackUriService {
  private config: CallbackUriConfig;
  private cache: Map<string, string> = new Map();

  constructor(config?: Partial<CallbackUriConfig>) {
    this.config = {
      origin: this.detectOrigin(),
      environment: this.detectEnvironment(),
      customPaths: {},
      ...config,
    };
  }

  /**
   * Detect the current origin dynamically
   */
  private detectOrigin(): string {
    if (typeof window === 'undefined') {
      return 'https://localhost:3000'; // SSR fallback
    }
    return window.location.origin;
  }

  /**
   * Detect the current environment
   */
  private detectEnvironment(): 'development' | 'staging' | 'production' {
    if (typeof window === 'undefined') {
      return 'development';
    }
    
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    
    if (hostname.includes('staging') || hostname.includes('dev')) {
      return 'staging';
    }
    
    return 'production';
  }

  /**
   * Get callback URI for a specific flow
   */
  getCallbackUri(flowType: keyof FlowCallbackUris): string {
    const cacheKey = `${this.config.origin}-${flowType}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const uri = this.buildCallbackUri(flowType);
    this.cache.set(cacheKey, uri);
    return uri;
  }

  /**
   * Build callback URI for a specific flow type
   */
  private buildCallbackUri(flowType: keyof FlowCallbackUris): string {
    const { origin, customPaths } = this.config;
    
    // Check for custom path override
    if (customPaths?.[flowType]) {
      return `${origin}${customPaths[flowType]}`;
    }

    // Default paths based on flow type
    const defaultPaths: Record<keyof FlowCallbackUris, string> = {
      authzCallback: '/authz-callback',
      implicitCallback: '/implicit-callback',
      logoutCallback: '/logout-callback',
      hybridCallback: '/hybrid-callback',
      oauthV3Callback: '/oauth-v3-callback',
      workerTokenCallback: '/worker-token-callback',
      deviceCodeCallback: '/device-code-status',
      dashboardCallback: '/dashboard-callback',
      p1authCallback: '/p1auth-callback',
      authzLogoutCallback: '/authz-logout-callback',
      implicitLogoutCallback: '/implicit-logout-callback',
      hybridLogoutCallback: '/hybrid-logout-callback',
      deviceLogoutCallback: '/device-logout-callback',
      workerTokenLogoutCallback: '/worker-token-logout-callback',
      p1authLogoutCallback: '/p1auth-logout-callback',
      dashboardLogoutCallback: '/dashboard-logout-callback',
    };

    return `${origin}${defaultPaths[flowType]}`;
  }

  /**
   * Get all callback URIs for the current environment
   */
  getAllCallbackUris(): FlowCallbackUris {
    return {
      authzCallback: this.getCallbackUri('authzCallback'),
      implicitCallback: this.getCallbackUri('implicitCallback'),
      logoutCallback: this.getCallbackUri('logoutCallback'),
      hybridCallback: this.getCallbackUri('hybridCallback'),
      oauthV3Callback: this.getCallbackUri('oauthV3Callback'),
      workerTokenCallback: this.getCallbackUri('workerTokenCallback'),
      deviceCodeCallback: this.getCallbackUri('deviceCodeCallback'),
      dashboardCallback: this.getCallbackUri('dashboardCallback'),
    };
  }

  /**
   * Get callback URI for a specific flow with fallback
   */
  getCallbackUriForFlow(flowKey: string): string {
    // Map flow keys to callback types
    const flowMapping: Record<string, keyof FlowCallbackUris> = {
      'authorization-code': 'authzCallback',
      'oauth-authorization-code-v7': 'authzCallback',
      'implicit': 'implicitCallback',
      'implicit-v7': 'implicitCallback',
      'hybrid': 'hybridCallback',
      'hybrid-v7': 'hybridCallback',
      'oauth-v3': 'oauthV3Callback',
      'worker-token': 'workerTokenCallback',
      'device-authorization': 'deviceCodeCallback',
      'dashboard': 'dashboardCallback',
    };

    const callbackType = flowMapping[flowKey] || 'authzCallback';
    return this.getCallbackUri(callbackType);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CallbackUriConfig>): void {
    this.config = { ...this.config, ...config };
    this.cache.clear(); // Clear cache when config changes
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get current configuration
   */
  getConfig(): CallbackUriConfig {
    return { ...this.config };
  }

  /**
   * Validate callback URI format
   */
  validateCallbackUri(uri: string): { isValid: boolean; error?: string } {
    try {
      const url = new URL(uri);
      
      // Must be HTTPS in production
      if (this.config.environment === 'production' && url.protocol !== 'https:') {
        return { isValid: false, error: 'Callback URI must use HTTPS in production' };
      }
      
      // Must match current origin
      if (url.origin !== this.config.origin) {
        return { isValid: false, error: `Callback URI origin must match current origin: ${this.config.origin}` };
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid callback URI format' };
    }
  }

  /**
   * Get the appropriate redirect URI and description for a specific flow type
   * @param flowType The type of flow
   * @returns Object with redirectUri and description
   */
  getRedirectUriForFlow(flowType: string): { redirectUri: string; description: string; note: string; logoutUri: string; logoutNote: string } {
    const flowMap: Record<string, { callbackType: keyof FlowCallbackUris; logoutType: keyof FlowCallbackUris; description: string; note: string; logoutNote: string }> = {
      'authorization_code': {
        callbackType: 'authzCallback',
        logoutType: 'authzLogoutCallback',
        description: 'Authorization Code Flow',
        note: 'Handles authorization code exchange for tokens. Required for OAuth Authorization Code Flow.',
        logoutNote: 'Handles logout redirects for Authorization Code Flow. Required for proper logout handling.'
      },
      'implicit': {
        callbackType: 'implicitCallback',
        logoutType: 'implicitLogoutCallback',
        description: 'Implicit Flow',
        note: 'Handles implicit flow token responses. Required for OAuth Implicit Flow.',
        logoutNote: 'Handles logout redirects for Implicit Flow. Required for proper logout handling.'
      },
      'hybrid': {
        callbackType: 'hybridCallback',
        logoutType: 'hybridLogoutCallback',
        description: 'OIDC Hybrid Flow',
        note: 'Handles OIDC hybrid flow responses. Required for OIDC Hybrid Flow.',
        logoutNote: 'Handles logout redirects for OIDC Hybrid Flow. Required for proper logout handling.'
      },
      'device': {
        callbackType: 'deviceCodeCallback',
        logoutType: 'deviceLogoutCallback',
        description: 'Device Authorization Flow',
        note: 'Handles device authorization flow status updates. Required for Device Authorization Flow.',
        logoutNote: 'Handles logout redirects for Device Authorization Flow. Required for proper logout handling.'
      },
      'client_credentials': {
        callbackType: 'workerTokenCallback',
        logoutType: 'workerTokenLogoutCallback',
        description: 'Worker Token Flow',
        note: 'Handles worker token flow callbacks. Required for Client Credentials Flow.',
        logoutNote: 'Handles logout redirects for Worker Token Flow. Required for proper logout handling.'
      },
      'pingone_auth': {
        callbackType: 'p1authCallback',
        logoutType: 'p1authLogoutCallback',
        description: 'PingOne Authentication',
        note: 'Handles PingOne Authentication playground callbacks. Required for PingOne Authentication flows.',
        logoutNote: 'Handles logout redirects for PingOne Authentication. Required for proper logout handling.'
      },
      'dashboard': {
        callbackType: 'dashboardCallback',
        logoutType: 'dashboardLogoutCallback',
        description: 'Dashboard Login',
        note: 'Handles dashboard login callbacks. Required for dashboard login flows.',
        logoutNote: 'Handles logout redirects for Dashboard Login. Required for proper logout handling.'
      }
    };

    const flowConfig = flowMap[flowType] || flowMap['authorization_code'];
    const redirectUri = this.getCallbackUri(flowConfig.callbackType);
    const logoutUri = this.getCallbackUri(flowConfig.logoutType);

    return {
      redirectUri,
      description: flowConfig.description,
      note: flowConfig.note,
      logoutUri,
      logoutNote: flowConfig.logoutNote
    };
  }

  /**
   * Get all redirect URIs with their descriptions for documentation
   * @returns Array of redirect URI information
   */
  getAllRedirectUriInfo(): Array<{ flowType: string; redirectUri: string; description: string; note: string; logoutUri: string; logoutNote: string }> {
    const flowTypes = ['authorization_code', 'implicit', 'hybrid', 'device', 'client_credentials', 'pingone_auth', 'dashboard'];
    
    return flowTypes.map(flowType => {
      const info = this.getRedirectUriForFlow(flowType);
      return {
        flowType,
        ...info
      };
    });
  }
}

// Export singleton instance
export const callbackUriService = new CallbackUriService();

// Export factory function for custom configurations
export const createCallbackUriService = (config?: Partial<CallbackUriConfig>) => {
  return new CallbackUriService(config);
};

// Export types for use in other services
export type { CallbackUriConfig, FlowCallbackUris };
