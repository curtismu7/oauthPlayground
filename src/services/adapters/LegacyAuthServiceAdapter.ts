/**
 * @file LegacyAuthServiceAdapter.ts
 * @module services/adapters
 * @description Adapter pattern for legacy authentication services
 * @version 1.0.0
 * @since 2026-02-22
 */

import type { AuthCredentials, AuthResult, TokenValidation, TokenRefreshResult, LogoutOptions } from '../../types/auth';
import { IAuthService, UnifiedAuthService } from '../unified/UnifiedAuthService';
import { logger } from '../../utils/logger';

/**
 * Legacy authentication service interface (old API)
 */
export interface ILegacyAuthService {
  login(username: string, password: string): Promise<LegacyAuthResult>;
  validateToken(token: string): Promise<LegacyTokenValidation>;
  logout(): Promise<void>;
}

/**
 * Legacy authentication result (old format)
 */
export interface LegacyAuthResult {
  success: boolean;
  token?: string;
  error?: string;
  user?: LegacyUserInfo;
}

/**
 * Legacy token validation (old format)
 */
export interface LegacyTokenValidation {
  valid: boolean;
  error?: string;
  expires?: Date;
}

/**
 * Legacy user info (old format)
 */
export interface LegacyUserInfo {
  id: string;
  username: string;
  email: string;
}

/**
 * Legacy Authentication Service Adapter
 * 
 * Adapts the new UnifiedAuthService to work with the legacy interface.
 * This allows existing code to continue working while we migrate to the new service.
 */
export class LegacyAuthServiceAdapter implements ILegacyAuthService {
  private unifiedAuthService: IAuthService;
  private migrationMode: boolean;

  constructor(unifiedAuthService?: IAuthService, migrationMode = false) {
    this.unifiedAuthService = unifiedAuthService || new UnifiedAuthService();
    this.migrationMode = migrationMode;
    
    if (migrationMode) {
      logger.info('LegacyAuthServiceAdapter running in migration mode');
    }
  }

  /**
   * Login using legacy API
   */
  async login(username: string, password: string): Promise<LegacyAuthResult> {
    try {
      // Translate legacy credentials to new format
      const newCredentials = this.translateLegacyCredentials(username, password);
      
      // Call new service
      const authResult = await this.unifiedAuthService.authenticate(newCredentials);
      
      // Translate result back to legacy format
      return this.translateAuthResult(authResult);
      
    } catch (error) {
      logger.error('Legacy login failed:', error);
      
      return {
        success: false,
        error: this.translateError(error)
      };
    }
  }

  /**
   * Validate token using legacy API
   */
  async validateToken(token: string): Promise<LegacyTokenValidation> {
    try {
      // Call new service
      const tokenValidation = await this.unifiedAuthService.validateToken(token);
      
      // Translate result back to legacy format
      return this.translateTokenValidation(tokenValidation);
      
    } catch (error) {
      logger.error('Legacy token validation failed:', error);
      
      return {
        valid: false,
        error: this.translateError(error)
      };
    }
  }

  /**
   * Logout using legacy API
   */
  async logout(): Promise<void> {
    try {
      // Call new service with legacy options
      await this.unifiedAuthService.logout({
        revokeTokens: true,
        clearSession: true,
        clearCredentials: true
      });
      
    } catch (error) {
      logger.error('Legacy logout failed:', error);
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  /**
   * Get migration status
   */
  getMigrationStatus(): {
    return {
      isLegacy: true,
      migrationMode: this.migrationMode,
      adapterVersion: '1.0.0',
      targetService: this.unifiedAuthService.name,
      targetVersion: this.unifiedAuthService.version
    };
  }

  // Private helper methods

  private translateLegacyCredentials(username: string, password: string): AuthCredentials {
    // This would translate legacy username/password to the new credential format
    // In a real implementation, this would involve looking up the client ID, etc.
    return {
      clientId: username, // In legacy, username was used as clientId
      clientSecret: password,
      environmentId: 'default', // Would be configured or discovered
      scopes: 'openid profile email',
      grantType: 'password'
    };
  }

  private translateAuthResult(authResult: AuthResult): LegacyAuthResult {
    if (!authResult.success) {
      return {
        success: false,
        error: 'Authentication failed'
      };
    }

    return {
      success: true,
      token: authResult.tokens?.accessToken,
      user: authResult.userInfo ? this.translateUserInfo(authResult.userInfo) : undefined
    };
  }

  private translateTokenValidation(tokenValidation: TokenValidation): LegacyTokenValidation {
    return {
      valid: tokenValidation.isValid,
      error: tokenValidation.errors.length > 0 ? tokenValidation.errors.join(', ') : undefined,
      expires: tokenValidation.expiresAt
    };
  }

  private translateUserInfo(userInfo: any): LegacyUserInfo {
    return {
      id: userInfo.sub || userInfo.id,
      username: userInfo.preferred_username || userInfo.name || userInfo.email,
      email: userInfo.email
    };
  }

  private translateError(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'Unknown error occurred';
  }
}

/**
 * Factory function for creating adapters
 */
export class LegacyAuthServiceAdapterFactory {
  /**
   * Create an adapter for a specific legacy service
   */
  static createAdapter(
    legacyServiceName: string,
    unifiedAuthService?: IAuthService,
    options?: AdapterOptions
  ): ILegacyAuthService {
    
    switch (legacyServiceName) {
      case 'authTokenService':
        return new LegacyAuthServiceAdapter(unifiedAuthService, options?.migrationMode);
      
      case 'pingOneAuthService':
        return new PingOneAuthServiceAdapter(unifiedAuthService, options?.migrationMode);
      
      default:
        return new LegacyAuthServiceAdapter(unifiedAuthService, options?.migrationMode);
    }
  }
  
  /**
   * Create multiple adapters for batch migration
   */
  static createBatchAdapters(
    services: string[],
    unifiedAuthService?: IAuthService,
    options?: AdapterOptions
  ): Record<string, ILegacyAuthService> {
    
    const adapters: Record<string, ILegacyAuthService> = {};
    
    for (const serviceName of services) {
      adapters[serviceName] = this.createAdapter(serviceName, unifiedAuthService, options);
    }
    
    return adapters;
  }
}

/**
 * PingOne-specific adapter
 */
export class PingOneAuthServiceAdapter extends LegacyAuthServiceAdapter {
  async login(username: string, password: string): Promise<LegacyAuthResult> {
    try {
      // PingOne-specific credential translation
      const newCredentials = {
        clientId: username,
        clientSecret: password,
        environmentId: this.extractEnvironmentId(username),
        scopes: 'openid profile email pingone:admin.read pingone:user.read',
        grantType: 'password'
      };
      
      const authResult = await this.unifiedAuthService.authenticate(newCredentials);
      
      return this.translateAuthResult(authResult);
      
    } catch (error) {
      logger.error('PingOne login failed:', error);
      
      return {
        success: false,
        error: this.translateError(error)
      };
    }
  }

  private extractEnvironmentId(clientId: string): string {
    // Extract environment ID from client ID or use default
    // This is a simplified example
    return clientId.includes('-') ? clientId.split('-')[0] : 'default';
  }
}

/**
 * Adapter options
 */
export interface AdapterOptions {
  migrationMode?: boolean;
  enableLogging?: boolean;
  fallbackToLegacy?: boolean;
}

/**
 * Migration helper
 */
export class ServiceMigrationHelper {
  /**
   * Test adapter compatibility
   */
  static async testAdapterCompatibility(
    adapter: ILegacyAuthService,
    testCases: LegacyTestCase[]
  ): Promise<CompatibilityReport> {
    
    const results: TestCaseResult[] = [];
    
    for (const testCase of testCases) {
      try {
        const result = await this.runTestCase(adapter, testCase);
        results.push(result);
      } catch (error) {
        results.push({
          testCase: testCase.name,
          success: false,
          error: error.message,
          duration: 0
        });
      }
    }
    
    const passedTests = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    return {
      adapterName: adapter.constructor.name,
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      compatibility: passedTests / totalTests,
      results
    };
  }
  
  private static async runTestCase(
    adapter: ILegacyAuthService,
    testCase: LegacyTestCase
  ): Promise<TestCaseResult> {
    
    const startTime = Date.now();
    
    switch (testCase.type) {
      case 'login':
        const loginResult = await adapter.login(testCase.input.username, testCase.input.password);
        return {
          testCase: testCase.name,
          success: loginResult.success === testCase.expected.success,
          duration: Date.now() - startTime
        };
        
      case 'validateToken':
        const validationResult = await adapter.validateToken(testCase.input.token);
        return {
          testCase: testCase.name,
          success: validationResult.valid === testCase.expected.valid,
          duration: Date.now() - startTime
        };
        
      case 'logout':
        await adapter.logout();
        return {
          testCase: testCase.name,
          success: true,
          duration: Date.now() - startTime
        };
        
      default:
        throw new Error(`Unknown test case type: ${testCase.type}`);
    }
  }
}

// Type definitions
export interface LegacyTestCase {
  name: string;
  type: 'login' | 'validateToken' | 'logout';
  input: any;
  expected: any;
}

export interface TestCaseResult {
  testCase: string;
  success: boolean;
  error?: string;
  duration: number;
}

export interface CompatibilityReport {
  adapterName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  compatibility: number;
  results: TestCaseResult[];
}

// Export for dependency injection
export { LegacyAuthServiceAdapter, PingOneAuthServiceAdapter, LegacyAuthServiceAdapterFactory };

// Export types
export type { 
  ILegacyAuthService, 
  LegacyAuthResult, 
  LegacyTokenValidation, 
  LegacyUserInfo,
  AdapterOptions,
  LegacyTestCase,
  TestCaseResult,
  CompatibilityReport
};
