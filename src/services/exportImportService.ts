// src/services/exportImportService.ts
// Export/Import service for application configurations

import type { FormDataState, BuilderAppType } from './presetManagerService';
import { validateConfiguration } from '../utils/presetValidation';

export interface ExportedConfiguration {
  version: string;
  exportedAt: string;
  appType: BuilderAppType;
  configuration: FormDataState;
  metadata: {
    name: string;
    description: string;
    source: 'generator' | 'existing-app' | 'preset';
    exportedBy?: string;
    originalPresetId?: string;
  };
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  configuration?: FormDataState;
  metadata?: ExportedConfiguration['metadata'];
}

export interface ExportImportService {
  exportConfiguration(
    formData: FormDataState, 
    appType: BuilderAppType, 
    metadata: Partial<ExportedConfiguration['metadata']>
  ): void;
  importConfiguration(file: File): Promise<ImportValidationResult>;
  validateImportedConfiguration(config: ExportedConfiguration): ImportValidationResult;
  exportPresetAsConfiguration(presetId: string): void;
  createConfigurationBlob(config: ExportedConfiguration): Blob;
}

// Current export format version
const EXPORT_VERSION = '1.0.0';

// Supported import versions (for backward compatibility)
const SUPPORTED_VERSIONS = ['1.0.0'];

class ExportImportServiceImpl implements ExportImportService {
  
  /**
   * Exports current form configuration as a downloadable JSON file
   */
  exportConfiguration(
    formData: FormDataState, 
    appType: BuilderAppType, 
    metadata: Partial<ExportedConfiguration['metadata']> = {}
  ): void {
    try {
      const exportConfig: ExportedConfiguration = {
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        appType,
        configuration: this.sanitizeConfiguration(formData),
        metadata: {
          name: metadata.name || formData.name || 'Unnamed Configuration',
          description: metadata.description || formData.description || 'Exported application configuration',
          source: metadata.source || 'generator',
          exportedBy: metadata.exportedBy || 'PingOne Application Generator',
          ...metadata
        }
      };

      this.downloadConfiguration(exportConfig);
    } catch (error) {
      console.error('[ExportImport] Failed to export configuration:', error);
      throw new Error('Failed to export configuration');
    }
  }

  /**
   * Imports configuration from uploaded JSON file
   */
  async importConfiguration(file: File): Promise<ImportValidationResult> {
    try {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.json')) {
        return {
          isValid: false,
          errors: ['File must be a JSON file (.json extension)'],
          warnings: []
        };
      }

      // Validate file size (max 1MB)
      if (file.size > 1024 * 1024) {
        return {
          isValid: false,
          errors: ['File size too large. Maximum size is 1MB.'],
          warnings: []
        };
      }

      // Read file content
      const fileContent = await this.readFileAsText(file);
      
      // Parse JSON
      let parsedConfig: any;
      try {
        parsedConfig = JSON.parse(fileContent);
      } catch (parseError) {
        return {
          isValid: false,
          errors: ['Invalid JSON format. Please check the file content.'],
          warnings: []
        };
      }

      // Validate configuration structure
      return this.validateImportedConfiguration(parsedConfig);

    } catch (error) {
      console.error('[ExportImport] Failed to import configuration:', error);
      return {
        isValid: false,
        errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Validates imported configuration structure and content
   */
  validateImportedConfiguration(config: any): ImportValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if it's an ExportedConfiguration
      if (!config || typeof config !== 'object') {
        return {
          isValid: false,
          errors: ['Invalid configuration format'],
          warnings: []
        };
      }

      // Validate version
      if (!config.version) {
        warnings.push('Configuration version not specified, assuming current version');
      } else if (!SUPPORTED_VERSIONS.includes(config.version)) {
        errors.push(`Unsupported configuration version: ${config.version}. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`);
      }

      // Validate required fields
      if (!config.appType) {
        errors.push('Application type is required');
      } else if (!['OIDC_WEB_APP', 'OIDC_NATIVE_APP', 'SINGLE_PAGE_APP', 'WORKER', 'SERVICE'].includes(config.appType)) {
        errors.push(`Invalid application type: ${config.appType}`);
      }

      if (!config.configuration) {
        errors.push('Configuration data is required');
      }

      if (!config.metadata) {
        warnings.push('Configuration metadata is missing');
      }

      // If basic structure is invalid, return early
      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }

      // Validate configuration content
      const configValidation = validateConfiguration(config.configuration, config.appType);
      errors.push(...configValidation.errors.map(e => e.message));
      warnings.push(...configValidation.warnings.map(w => w.message));

      // Sanitize and normalize configuration
      const sanitizedConfig = this.sanitizeConfiguration(config.configuration);

      // Check for potential security issues
      this.checkSecurityIssues(sanitizedConfig, config.appType, warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        configuration: sanitizedConfig,
        metadata: config.metadata
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      };
    }
  }

  /**
   * Exports a preset as a configuration file
   */
  exportPresetAsConfiguration(presetId: string): void {
    try {
      // This would require importing presetManagerService
      // For now, we'll throw an error to indicate it needs to be implemented
      throw new Error('Preset export not yet implemented. Use the preset manager directly.');
    } catch (error) {
      console.error('[ExportImport] Failed to export preset:', error);
      throw error;
    }
  }

  /**
   * Creates a Blob object from configuration for download
   */
  createConfigurationBlob(config: ExportedConfiguration): Blob {
    const jsonString = JSON.stringify(config, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  }

  /**
   * Private helper methods
   */

  private sanitizeConfiguration(config: FormDataState): FormDataState {
    return {
      ...config,
      // Ensure arrays are properly formatted
      redirectUris: Array.isArray(config.redirectUris) 
        ? config.redirectUris.filter(uri => uri?.trim())
        : [],
      postLogoutRedirectUris: Array.isArray(config.postLogoutRedirectUris)
        ? config.postLogoutRedirectUris.filter(uri => uri?.trim())
        : [],
      grantTypes: Array.isArray(config.grantTypes)
        ? config.grantTypes.filter(grant => grant?.trim())
        : [],
      responseTypes: Array.isArray(config.responseTypes)
        ? config.responseTypes.filter(type => type?.trim())
        : [],
      scopes: Array.isArray(config.scopes)
        ? config.scopes.filter(scope => scope?.trim())
        : [],
      signoffUrls: Array.isArray(config.signoffUrls)
        ? config.signoffUrls.filter(url => url?.trim())
        : [],
      // Sanitize string fields
      name: config.name?.trim() || '',
      description: config.description?.trim() || '',
      jwksUrl: config.jwksUrl?.trim() || '',
      initiateLoginUri: config.initiateLoginUri?.trim() || '',
      targetLinkUri: config.targetLinkUri?.trim() || ''
    };
  }

  private downloadConfiguration(config: ExportedConfiguration): void {
    const blob = this.createConfigurationBlob(config);
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = this.generateFileName(config);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }

  private generateFileName(config: ExportedConfiguration): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const appName = config.metadata.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `${appName || 'app-config'}-${config.appType.toLowerCase()}-${timestamp}.json`;
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File reading failed'));
      };
      
      reader.readAsText(file);
    });
  }

  private checkSecurityIssues(config: FormDataState, appType: BuilderAppType, warnings: string[]): void {
    // Check for insecure redirect URIs
    if (config.redirectUris) {
      config.redirectUris.forEach(uri => {
        if (uri.startsWith('http://') && !uri.includes('localhost') && !uri.includes('127.0.0.1')) {
          warnings.push(`Insecure redirect URI detected: ${uri}. Consider using HTTPS.`);
        }
      });
    }

    // Check for overly permissive settings
    if (config.allowRedirectUriPatterns && appType !== 'OIDC_WEB_APP') {
      warnings.push('Redirect URI patterns should be used carefully with non-web applications.');
    }

    // Check token validity periods
    if (config.accessTokenValiditySeconds > 86400) { // > 24 hours
      warnings.push('Access token validity period is very long (>24 hours). Consider shorter periods for better security.');
    }

    if (config.refreshTokenValiditySeconds > 2592000) { // > 30 days
      warnings.push('Refresh token validity period is very long (>30 days). Consider shorter periods for better security.');
    }

    // Check PKCE enforcement
    if ((appType === 'SINGLE_PAGE_APP' || appType === 'OIDC_NATIVE_APP') && config.pkceEnforcement !== 'REQUIRED') {
      warnings.push('PKCE should be required for SPAs and native applications for security.');
    }

    // Check scopes
    if (config.scopes && config.scopes.length > 10) {
      warnings.push('Large number of scopes requested. Consider if all scopes are necessary.');
    }
  }
}

// Export singleton instance
export const exportImportService = new ExportImportServiceImpl();

// Export utility functions for direct use
export const exportUtils = {
  /**
   * Quick export function for use in components
   */
  quickExport: (formData: FormDataState, appType: BuilderAppType, name?: string) => {
    exportImportService.exportConfiguration(formData, appType, {
      name: name || formData.name,
      source: 'generator'
    });
  },

  /**
   * Create shareable configuration object (without downloading)
   */
  createShareableConfig: (formData: FormDataState, appType: BuilderAppType): ExportedConfiguration => {
    return {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      appType,
      configuration: formData,
      metadata: {
        name: formData.name || 'Shared Configuration',
        description: formData.description || 'Shared application configuration',
        source: 'generator'
      }
    };
  },

  /**
   * Validate file before import (client-side checks)
   */
  validateFile: (file: File): { valid: boolean; error?: string } => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      return { valid: false, error: 'File must be a JSON file' };
    }
    
    if (file.size > 1024 * 1024) {
      return { valid: false, error: 'File size too large (max 1MB)' };
    }
    
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }
    
    return { valid: true };
  }
};