import { lazy, ComponentType } from 'react';
import { logger } from './logger';

// OAuth Flow Component Types
export type OAuthFlowComponent = ComponentType<any>;

// OAuth Flow Registry
export interface OAuthFlowRegistry {
  [key: string]: () => Promise<{ default: OAuthFlowComponent }>;
}

// Lazy loading configuration
export interface LazyLoadingConfig {
  fallbackComponent?: ComponentType;
  loadingDelay?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// Default lazy loading configuration
const defaultConfig: LazyLoadingConfig = {
  fallbackComponent: undefined,
  loadingDelay: 200, // ms
  retryAttempts: 3,
  retryDelay: 1000 // ms
};

// OAuth Flow Registry - All flows with lazy loading
export const oauthFlowRegistry: OAuthFlowRegistry = {
  // Authorization Code Flow
  'authorization-code': () => import('../pages/flows/AuthorizationCodeFlow'),
  'authorization-code-pkce': () => import('../pages/flows/AuthorizationCodePKCEFlow'),
  
  // Implicit Grant Flow
  'implicit-grant': () => import('../pages/flows/ImplicitGrantFlow'),
  
  // Client Credentials Flow
  'client-credentials': () => import('../pages/flows/ClientCredentialsFlow'),
  
  // Resource Owner Password Credentials Flow
  'password': () => import('../pages/flows/PasswordFlow'),
  
  // Device Authorization Flow
  'device-code': () => import('../pages/flows/DeviceCodeFlow'),
  
  // JWT Bearer Flow
  'jwt-bearer': () => import('../pages/flows/JWTBearerFlow'),
  
  // SAML Bearer Flow
  'saml-bearer': () => import('../pages/flows/SAMLBearerFlow'),
  
  // Refresh Token Flow
  'refresh-token': () => import('../pages/flows/RefreshTokenFlow'),
  
  // Token Exchange Flow
  'token-exchange': () => import('../pages/flows/TokenExchangeFlow'),
  
  // CIBA Flow
  'ciba': () => import('../pages/flows/CIBAFlow'),
  
  // PAR Flow
  'par': () => import('../pages/flows/PARFlow'),
  
  // DPoP Flow
  'dpop': () => import('../pages/flows/DPoPFlow'),
  
  // Mutual TLS Flow
  'mutual-tls': () => import('../pages/flows/MutualTLSFlow'),
  
  // OIDC Flows
  'oidc-authorization-code': () => import('../pages/flows/OIDCAuthorizationCodeFlow'),
  'oidc-implicit': () => import('../pages/flows/OIDCImplicitFlow'),
  'oidc-hybrid': () => import('../pages/flows/OIDCHybridFlow'),
  
  // Advanced Flows
  'advanced-authorization-code': () => import('../pages/flows/AdvancedAuthorizationCodeFlow'),
  'advanced-implicit': () => import('../pages/flows/AdvancedImplicitFlow'),
  'advanced-client-credentials': () => import('../pages/flows/AdvancedClientCredentialsFlow'),
  'advanced-password': () => import('../pages/flows/AdvancedPasswordFlow'),
  'advanced-device-code': () => import('../pages/flows/AdvancedDeviceCodeFlow'),
  'advanced-jwt-bearer': () => import('../pages/flows/AdvancedJWTBearerFlow'),
  'advanced-saml-bearer': () => import('../pages/flows/AdvancedSAMLBearerFlow'),
  'advanced-refresh-token': () => import('../pages/flows/AdvancedRefreshTokenFlow'),
  'advanced-token-exchange': () => import('../pages/flows/AdvancedTokenExchangeFlow'),
  'advanced-ciba': () => import('../pages/flows/AdvancedCIBAFlow'),
  'advanced-par': () => import('../pages/flows/AdvancedPARFlow'),
  'advanced-dpop': () => import('../pages/flows/AdvancedDPoPFlow'),
  'advanced-mutual-tls': () => import('../pages/flows/AdvancedMutualTLSFlow')
};

// Lazy Loading Manager Class
export class LazyLoadingManager {
  private config: LazyLoadingConfig;
  private loadedComponents: Map<string, OAuthFlowComponent> = new Map();
  private loadingPromises: Map<string, Promise<OAuthFlowComponent>> = new Map();

  constructor(config: Partial<LazyLoadingConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Load OAuth flow component with retry logic
  async loadOAuthFlow(flowType: string): Promise<OAuthFlowComponent> {
    // Check if already loaded
    if (this.loadedComponents.has(flowType)) {
      return this.loadedComponents.get(flowType)!;
    }

    // Check if currently loading
    if (this.loadingPromises.has(flowType)) {
      return this.loadingPromises.get(flowType)!;
    }

    // Start loading
    const loadingPromise = this.loadWithRetry(flowType);
    this.loadingPromises.set(flowType, loadingPromise);

    try {
      const component = await loadingPromise;
      this.loadedComponents.set(flowType, component);
      this.loadingPromises.delete(flowType);
      
      logger.info(`[LazyLoading] Successfully loaded OAuth flow: ${flowType}`);
      return component;
    } catch (error) {
      this.loadingPromises.delete(flowType);
      logger.error(`[LazyLoading] Failed to load OAuth flow: ${flowType}`, error);
      throw error;
    }
  }

  // Load component with retry logic
  private async loadWithRetry(flowType: string): Promise<OAuthFlowComponent> {
    const importFunction = oauthFlowRegistry[flowType];
    
    if (!importFunction) {
      throw new Error(`OAuth flow not found: ${flowType}`);
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        // Add loading delay for better UX
        if (attempt > 1 && this.config.loadingDelay) {
          await new Promise(resolve => setTimeout(resolve, this.config.loadingDelay));
        }

        const module = await importFunction();
        return module.default;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`[LazyLoading] Attempt ${attempt} failed for ${flowType}:`, error);
        
        if (attempt < this.config.retryAttempts!) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    throw new Error(`Failed to load OAuth flow ${flowType} after ${this.config.retryAttempts} attempts: ${lastError?.message}`);
  }

  // Preload OAuth flow components
  async preloadOAuthFlows(flowTypes: string[]): Promise<void> {
    const preloadPromises = flowTypes.map(flowType => 
      this.loadOAuthFlow(flowType).catch(error => {
        logger.warn(`[LazyLoading] Preload failed for ${flowType}:`, error);
      })
    );

    await Promise.allSettled(preloadPromises);
    logger.info(`[LazyLoading] Preloaded ${flowTypes.length} OAuth flows`);
  }

  // Get loaded component count
  getLoadedComponentCount(): number {
    return this.loadedComponents.size;
  }

  // Get loading component count
  getLoadingComponentCount(): number {
    return this.loadingPromises.size;
  }

  // Clear loaded components (for memory management)
  clearLoadedComponents(): void {
    this.loadedComponents.clear();
    logger.info('[LazyLoading] Cleared all loaded components');
  }

  // Update configuration
  updateConfig(newConfig: Partial<LazyLoadingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('[LazyLoading] Configuration updated');
  }

  // Get current configuration
  getConfig(): LazyLoadingConfig {
    return { ...this.config };
  }
}

// Create global lazy loading manager instance
export const lazyLoadingManager = new LazyLoadingManager();

// Utility functions for lazy loading
export const loadOAuthFlow = (flowType: string): Promise<OAuthFlowComponent> => {
  return lazyLoadingManager.loadOAuthFlow(flowType);
};

export const preloadOAuthFlows = (flowTypes: string[]): Promise<void> => {
  return lazyLoadingManager.preloadOAuthFlows(flowTypes);
};

export const getLoadedComponentCount = (): number => {
  return lazyLoadingManager.getLoadedComponentCount();
};

export const getLoadingComponentCount = (): number => {
  return lazyLoadingManager.getLoadingComponentCount();
};

// Create lazy components for common flows
export const LazyAuthorizationCodeFlow = lazy(() => import('../pages/flows/AuthorizationCodeFlow'));
export const LazyImplicitGrantFlow = lazy(() => import('../pages/flows/ImplicitGrantFlow'));
export const LazyClientCredentialsFlow = lazy(() => import('../pages/flows/ClientCredentialsFlow'));
export const LazyPasswordFlow = lazy(() => import('../pages/flows/PasswordFlow'));
export const LazyDeviceCodeFlow = lazy(() => import('../pages/flows/DeviceCodeFlow'));

// Performance monitoring for lazy loading
export const lazyLoadingMetrics = {
  loadTimes: new Map<string, number>(),
  errorCounts: new Map<string, number>(),
  
  recordLoadTime(flowType: string, loadTime: number): void {
    this.loadTimes.set(flowType, loadTime);
  },
  
  recordError(flowType: string): void {
    const currentCount = this.errorCounts.get(flowType) || 0;
    this.errorCounts.set(flowType, currentCount + 1);
  },
  
  getLoadTime(flowType: string): number | undefined {
    return this.loadTimes.get(flowType);
  },
  
  getErrorCount(flowType: string): number {
    return this.errorCounts.get(flowType) || 0;
  },
  
  getAverageLoadTime(): number {
    const times = Array.from(this.loadTimes.values());
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  },
  
  getTotalErrors(): number {
    return Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
  },
  
  clearMetrics(): void {
    this.loadTimes.clear();
    this.errorCounts.clear();
  }
};

export default lazyLoadingManager;
