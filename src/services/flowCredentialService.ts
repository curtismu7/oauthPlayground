// src/services/flowCredentialService.ts
// Service for managing flow credentials and ensuring consistency between component state and flow hooks

import { credentialManager } from '../utils/credentialManager';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface FlowCredentialConfig {
  environmentId: string;
  clientId: string;
  clientSecret?: string;
  scopes: string;
  responseType?: string | 'code id_token' | 'code token' | 'code id_token token';
  responseMode?: string | 'query' | 'fragment' | 'form_post' | 'pi.flow';
  [key: string]: unknown; // Allow additional flow-specific properties
}

export interface FlowCredentialServiceOptions {
  flowName: string;
  logPrefix: string;
  requiredFields: string[];
}

export interface PartialCredentialUpdateOptions {
  validate?: boolean;
  persist?: boolean;
  showSuccessMessage?: boolean;
  successMessage?: string;
  logDetails?: boolean;
}

export class FlowCredentialService {
  private flowName: string;
  private logPrefix: string;
  private requiredFields: string[];

  constructor(options: FlowCredentialServiceOptions) {
    this.flowName = options.flowName;
    this.logPrefix = options.logPrefix;
    this.requiredFields = options.requiredFields;
  }

  private persistCredentials(config: FlowCredentialConfig) {
    const scopesValue = Array.isArray(config.scopes)
      ? config.scopes
      : typeof config.scopes === 'string'
        ? config.scopes.split(' ').filter(Boolean)
        : [];

    credentialManager.saveAllCredentials({
      environmentId: config.environmentId,
      clientId: config.clientId,
      clientSecret: config.clientSecret ?? '',
      scopes: scopesValue,
    });
  }

  /**
   * Validates that all required fields are present
   */
  validateCredentials(config: FlowCredentialConfig): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    this.requiredFields.forEach(field => {
      const value = config[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field);
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Updates flow credentials and ensures consistency
   */
  updateFlowCredentials(
    config: FlowCredentialConfig,
    setCredentials: (creds: FlowCredentialConfig) => void,
    options?: {
      showSuccessMessage?: boolean;
      logDetails?: boolean;
    }
  ): { success: boolean; error?: string } {
    try {
      // Validate credentials
      const validation = this.validateCredentials(config);
      if (!validation.isValid) {
        const errorMsg = `Missing required fields: ${validation.missingFields.join(', ')}`;
        v4ToastManager.showError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Update flow credentials
      setCredentials(config);

      // Save to credential manager for persistence
      this.persistCredentials(config);

      // Show success message if requested
      if (options?.showSuccessMessage !== false) {
        v4ToastManager.showSuccess('Credentials saved successfully!');
      }

      // Log details if requested
      if (options?.logDetails) {
        console.log(`${this.logPrefix} [INFO] Credentials updated`, {
          flowName: this.flowName,
          environmentId: config.environmentId,
          clientId: `${config.clientId.substring(0, 8)}...`,
          responseMode: config.responseMode,
          responseType: config.responseType,
        });
      }

      return { success: true };
    } catch (error) {
      const errorMsg = `Failed to update credentials: ${error}`;
      console.error(`${this.logPrefix} [ERROR]`, errorMsg, error);
      v4ToastManager.showError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Ensures credentials are up-to-date before performing flow actions
   */
  ensureCredentialsUpToDate(
    currentConfig: FlowCredentialConfig,
    setCredentials: (creds: FlowCredentialConfig) => void,
    actionName: string
  ): { success: boolean; error?: string } {
    console.log(`${this.logPrefix} [INFO] Ensuring credentials up-to-date for ${actionName}`, {
      responseMode: currentConfig.responseMode,
      responseType: currentConfig.responseType,
    });

    return this.updateFlowCredentials(currentConfig, setCredentials, {
      showSuccessMessage: false, // Don't show success message for background updates
      logDetails: true,
    });
  }

  /**
   * Partially update credentials without requiring all required fields.
   */
  partialUpdateFlowCredentials(
    currentConfig: FlowCredentialConfig,
    updates: Partial<FlowCredentialConfig>,
    setCredentials: (creds: FlowCredentialConfig) => void,
    options: PartialCredentialUpdateOptions = {}
  ): { success: boolean; updated?: FlowCredentialConfig; error?: string } {
    try {
      const mergedConfig = {
        ...currentConfig,
        ...updates,
      } as FlowCredentialConfig;

      if (options.validate) {
        const validation = this.validateCredentials(mergedConfig);
        if (!validation.isValid) {
          const errorMsg = `Missing required fields: ${validation.missingFields.join(', ')}`;
          v4ToastManager.showError(errorMsg);
          return { success: false, error: errorMsg };
        }
      }

      setCredentials(mergedConfig);

      if (options.persist !== false) {
        this.persistCredentials(mergedConfig);
      }

      if (options.showSuccessMessage) {
        v4ToastManager.showSuccess(options.successMessage ?? 'Credentials updated successfully.');
      }

      if (options.logDetails) {
        console.log(`${this.logPrefix} [INFO] Credentials patched`, {
          flowName: this.flowName,
          updates,
        });
      }

      return { success: true, updated: mergedConfig };
    } catch (error) {
      const errorMsg = `Failed to patch credentials: ${error}`;
      console.error(`${this.logPrefix} [ERROR]`, errorMsg, error);
      v4ToastManager.showError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Update an individual credential field.
   */
  updateCredentialField<
    TKey extends keyof FlowCredentialConfig
  >(
    currentConfig: FlowCredentialConfig,
    field: TKey,
    value: FlowCredentialConfig[TKey],
    setCredentials: (creds: FlowCredentialConfig) => void,
    options: PartialCredentialUpdateOptions = {}
  ) {
    return this.partialUpdateFlowCredentials(
      currentConfig,
      { [field]: value } as Partial<FlowCredentialConfig>,
      setCredentials,
      options
    );
  }

  /**
   * Loads saved credentials from credential manager
   */
  loadSavedCredentials(): Partial<FlowCredentialConfig> {
    try {
      const savedCreds = credentialManager.getAllCredentials();
      return {
        environmentId: savedCreds.environmentId || '',
        clientId: savedCreds.clientId || '',
        clientSecret: savedCreds.clientSecret || '',
        scopes: savedCreds.scopes?.join(' ') || 'openid profile email',
      };
    } catch (error) {
      console.error(`${this.logPrefix} [ERROR] Failed to load saved credentials:`, error);
      return {};
    }
  }
}

// Pre-configured service instances for different flows
export const hybridFlowCredentialService = new FlowCredentialService({
  flowName: 'OIDC Hybrid Flow',
  logPrefix: '[🔀 OIDC-HYBRID]',
  requiredFields: ['environmentId', 'clientId', 'scopes'],
});

export const authzCodeFlowCredentialService = new FlowCredentialService({
  flowName: 'OIDC Authorization Code Flow',
  logPrefix: '[🔐 OIDC-AUTHZ]',
  requiredFields: ['environmentId', 'clientId', 'scopes'],
});

export const implicitFlowCredentialService = new FlowCredentialService({
  flowName: 'OAuth Implicit Flow',
  logPrefix: '[⚡ OAUTH-IMPLICIT]',
  requiredFields: ['environmentId', 'clientId', 'scopes'],
});

// Factory function to create service for any flow
export const createFlowCredentialService = (options: FlowCredentialServiceOptions) => {
  return new FlowCredentialService(options);
};
