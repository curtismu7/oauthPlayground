// src/services/workerTokenCredentialsService.ts
// Worker Token Credentials Service - Specialized service for managing PingOne Worker Token credentials
// Provides client credentials grant configuration for machine-to-machine authentication

export interface WorkerTokenCredentials {
  environmentId: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  tokenEndpoint?: string;
  region?: 'us' | 'eu' | 'ap' | 'ca';
  tokenEndpointAuthMethod?: 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt';
}

export interface WorkerTokenConfig {
  environmentId: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  region: 'us' | 'eu' | 'ap' | 'ca';
  tokenEndpoint: string;
  lastUpdated: number;
}

export interface WorkerTokenValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class WorkerTokenCredentialsService {
  private readonly DEFAULT_STORAGE_KEY = 'pingone_worker_token_credentials';
  private readonly DEFAULT_SCOPES = [
    'p1:read:user',
    'p1:update:user', 
    'p1:read:device',
    'p1:update:device'
  ];

  /**
   * Get storage key for a specific flow type
   * This ensures each flow type has its own isolated credential storage
   */
  private getStorageKey(flowType?: string): string {
    if (!flowType || flowType === 'flow' || flowType === 'worker-token') {
      return this.DEFAULT_STORAGE_KEY;
    }
    // Create unique key per flow type to prevent conflicts
    return `pingone_worker_token_credentials_${flowType}`;
  }
  
  private readonly REGION_URLS = {
    us: 'https://auth.pingone.com',
    eu: 'https://auth.pingone.eu',
    ap: 'https://auth.pingone.asia',
    ca: 'https://auth.pingone.ca'
  };

  /**
   * Load worker token credentials from storage
   */
  loadCredentials(flowType?: string): WorkerTokenCredentials | null {
    try {
      const storageKey = this.getStorageKey(flowType);
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;
      
      const config: WorkerTokenConfig = JSON.parse(stored);
      
      return {
        environmentId: config.environmentId,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        scopes: config.scopes || this.DEFAULT_SCOPES,
        tokenEndpoint: config.tokenEndpoint,
        region: config.region || 'us'
      };
    } catch (error) {
      console.error('[WorkerTokenCredentialsService] Failed to load credentials:', error);
      return null;
    }
  }

  /**
   * Save worker token credentials to storage
   */
  saveCredentials(credentials: WorkerTokenCredentials, flowType?: string): boolean {
    try {
      const storageKey = this.getStorageKey(flowType);
      const config: WorkerTokenConfig = {
        environmentId: credentials.environmentId,
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        scopes: credentials.scopes || this.DEFAULT_SCOPES,
        region: credentials.region || 'us',
        tokenEndpoint: this.buildTokenEndpoint(credentials.environmentId, credentials.region || 'us'),
        lastUpdated: Date.now()
      };

      localStorage.setItem(storageKey, JSON.stringify(config));
      console.log('[WorkerTokenCredentialsService] Credentials saved successfully:', {
        flowType: flowType || 'default',
        storageKey,
        environmentId: credentials.environmentId?.substring(0, 20) + '...',
      });
      return true;
    } catch (error) {
      console.error('[WorkerTokenCredentialsService] Failed to save credentials:', error);
      return false;
    }
  }

  /**
   * Validate worker token credentials
   */
  validateCredentials(credentials: WorkerTokenCredentials): WorkerTokenValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!credentials.environmentId?.trim()) {
      errors.push('Environment ID is required');
    } else if (!this.isValidEnvironmentId(credentials.environmentId)) {
      errors.push('Environment ID must be a valid UUID format');
    }

    if (!credentials.clientId?.trim()) {
      errors.push('Client ID is required');
    }

    if (!credentials.clientSecret?.trim()) {
      errors.push('Client Secret is required');
    }

    // Business logic validation
    if (credentials.environmentId && credentials.clientId && 
        credentials.environmentId === credentials.clientId) {
      errors.push('Client ID cannot be the same as Environment ID');
    }

    // Scope validation
    if (!credentials.scopes || credentials.scopes.length === 0) {
      warnings.push('No scopes specified - using default MFA scopes');
    }

    // Client secret strength warning
    if (credentials.clientSecret && credentials.clientSecret.length < 16) {
      warnings.push('Client secret should be at least 16 characters for security');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Build token endpoint URL
   */
  buildTokenEndpoint(environmentId: string, region: 'us' | 'eu' | 'ap' | 'ca' = 'us'): string {
    const baseUrl = this.REGION_URLS[region];
    return `${baseUrl}/${environmentId}/as/token`;
  }

  /**
   * Get default credentials template
   */
  getDefaultCredentials(): WorkerTokenCredentials {
    return {
      environmentId: '',
      clientId: '',
      clientSecret: '',
      scopes: [...this.DEFAULT_SCOPES],
      region: 'us',
      tokenEndpointAuthMethod: 'client_secret_post'
    };
  }

  /**
   * Clear stored credentials
   */
  clearCredentials(flowType?: string): void {
    try {
      const storageKey = this.getStorageKey(flowType);
      localStorage.removeItem(storageKey);
      console.log('[WorkerTokenCredentialsService] Credentials cleared for flowType:', flowType || 'default');
    } catch (error) {
      console.error('[WorkerTokenCredentialsService] Failed to clear credentials:', error);
    }
  }

  /**
   * Check if credentials exist in storage
   */
  hasStoredCredentials(flowType?: string): boolean {
    return this.loadCredentials(flowType) !== null;
  }

  /**
   * Get credential metadata
   */
  getCredentialMetadata(flowType?: string): { lastUpdated?: number; hasCredentials: boolean } {
    try {
      const storageKey = this.getStorageKey(flowType);
      const stored = localStorage.getItem(storageKey);
      if (!stored) return { hasCredentials: false };
      
      const config: WorkerTokenConfig = JSON.parse(stored);
      return {
        lastUpdated: config.lastUpdated,
        hasCredentials: true
      };
    } catch (error) {
      console.error('[WorkerTokenCredentialsService] Failed to get metadata:', error);
      return { hasCredentials: false };
    }
  }

  /**
   * Validate environment ID format (UUID)
   */
  private isValidEnvironmentId(envId: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(envId);
  }

  /**
   * Get available regions
   */
  getAvailableRegions(): Array<{ value: 'us' | 'eu' | 'ap' | 'ca'; label: string; url: string }> {
    return [
      { value: 'us', label: 'US (North America)', url: this.REGION_URLS.us },
      { value: 'eu', label: 'EU (Europe)', url: this.REGION_URLS.eu },
      { value: 'ap', label: 'AP (Asia Pacific)', url: this.REGION_URLS.ap },
      { value: 'ca', label: 'CA (Canada)', url: this.REGION_URLS.ca }
    ];
  }

  /**
   * Get default scopes for MFA operations
   */
  getDefaultScopes(): string[] {
    return [...this.DEFAULT_SCOPES];
  }

  /**
   * Get additional available scopes
   */
  getAvailableScopes(): string[] {
    return [
      ...this.DEFAULT_SCOPES,
      'p1:read:group',
      'p1:update:group',
      'p1:read:role',
      'p1:update:role',
      'p1:read:application',
      'p1:update:application'
    ];
  }
}

// Export singleton instance
export const workerTokenCredentialsService = new WorkerTokenCredentialsService();
export default workerTokenCredentialsService;
