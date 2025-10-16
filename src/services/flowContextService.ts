// src/services/flowContextService.ts
// Centralized Flow Context Service for managing flow state and redirects

export interface FlowContext {
  flowType: string;
  flowVersion?: string;
  currentStep: number;
  returnPath: string;
  flowState: Record<string, any>;
  timestamp: number;
  credentials?: {
    environmentId: string;
    clientId: string;
    clientSecret?: string;
  };
  metadata?: {
    userAgent?: string;
    sessionId?: string;
    flowId?: string;
  };
}

export interface FlowContextValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RedirectResult {
  success: boolean;
  redirectUrl: string;
  error?: string;
}

/**
 * FlowContextService - Centralized service for managing OAuth flow context and redirects
 * 
 * This service addresses the redirect handling issues by:
 * 1. Providing consistent flow context management across all flows
 * 2. Generating proper return paths instead of hardcoded dashboard redirects
 * 3. Implementing security validation for flow context integrity
 * 4. Supporting multiple flow types with proper state preservation
 */
export class FlowContextService {
  private static readonly FLOW_CONTEXT_KEY = 'flowContext';
  private static readonly TOKEN_MANAGEMENT_CONTEXT_KEY = 'tokenManagementFlowContext';
  private static readonly MAX_CONTEXT_AGE_MS = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_CONTEXT_SIZE = 50000; // 50KB limit

  /**
   * Save flow context to session storage with validation
   */
  static saveFlowContext(flowId: string, context: FlowContext): boolean {
    try {
      // Validate context before saving
      const validation = this.validateFlowContext(context);
      if (!validation.valid) {
        console.warn('[FlowContextService] Invalid flow context:', validation.errors);
        return false;
      }

      // Add metadata
      const enhancedContext: FlowContext = {
        ...context,
        timestamp: Date.now(),
        metadata: {
          ...context.metadata,
          sessionId: this.generateSessionId(),
          flowId,
          userAgent: navigator.userAgent.substring(0, 200) // Limit user agent length
        }
      };

      // Check size limit
      const contextString = JSON.stringify(enhancedContext);
      if (contextString.length > this.MAX_CONTEXT_SIZE) {
        console.warn('[FlowContextService] Flow context exceeds size limit');
        return false;
      }

      // Determine storage key based on flow type
      const storageKey = this.getStorageKey(context.flowType);
      
      sessionStorage.setItem(storageKey, contextString);
      
      console.log(`[FlowContextService] Saved flow context for ${flowId}:`, {
        flowType: context.flowType,
        returnPath: context.returnPath,
        currentStep: context.currentStep,
        timestamp: enhancedContext.timestamp
      });

      return true;
    } catch (error) {
      console.error('[FlowContextService] Failed to save flow context:', error);
      return false;
    }
  }

  /**
   * Get flow context from session storage with validation
   */
  static getFlowContext(flowId?: string): FlowContext | null {
    try {
      // Try different storage keys
      const storageKeys = [
        this.FLOW_CONTEXT_KEY,
        this.TOKEN_MANAGEMENT_CONTEXT_KEY,
        'implicit_flow_v3_context'
      ];

      for (const key of storageKeys) {
        const contextString = sessionStorage.getItem(key);
        if (contextString) {
          const context = JSON.parse(contextString) as FlowContext;
          
          // Validate context
          const validation = this.validateFlowContext(context);
          if (!validation.valid) {
            console.warn(`[FlowContextService] Invalid context from ${key}:`, validation.errors);
            this.clearFlowContext(key);
            continue;
          }

          // Check age
          if (this.isContextExpired(context)) {
            console.warn(`[FlowContextService] Expired context from ${key}`);
            this.clearFlowContext(key);
            continue;
          }

          console.log(`[FlowContextService] Retrieved valid flow context from ${key}:`, {
            flowType: context.flowType,
            returnPath: context.returnPath,
            age: Date.now() - context.timestamp
          });

          return context;
        }
      }

      console.log('[FlowContextService] No valid flow context found');
      return null;
    } catch (error) {
      console.error('[FlowContextService] Failed to get flow context:', error);
      return null;
    }
  }

  /**
   * Clear flow context from session storage
   */
  static clearFlowContext(flowId?: string): void {
    try {
      if (flowId && typeof flowId === 'string') {
        // Clear specific key if provided
        sessionStorage.removeItem(flowId);
      } else {
        // Clear all known flow context keys
        const keys = [
          this.FLOW_CONTEXT_KEY,
          this.TOKEN_MANAGEMENT_CONTEXT_KEY,
          'implicit_flow_v3_context'
        ];
        
        keys.forEach(key => sessionStorage.removeItem(key));
      }

      console.log('[FlowContextService] Cleared flow context');
    } catch (error) {
      console.error('[FlowContextService] Failed to clear flow context:', error);
    }
  }

  /**
   * Build return path for flow-specific redirects
   */
  static buildReturnPath(flowType: string, stepId?: string, additionalParams?: Record<string, string>): string {
    try {
      const basePathMap: Record<string, string> = {
        'authorization-code': '/flows/authorization-code',
        'authorization-code-v3': '/flows/enhanced-authorization-code',
        'authorization-code-v5': '/flows/authorization-code-v5',
        'implicit': '/flows/implicit',
        'implicit-v3': '/flows/implicit-v3',
        'client-credentials': '/flows/client-credentials',
        'client-credentials-v5': '/flows/client-credentials-v5',
        'device-authorization': '/flows/device-authorization',
        'device-authorization-v6': '/flows/device-authorization-v6',
        'oidc-device-authorization': '/flows/oidc-device-authorization',
        'oidc-device-authorization-v6': '/flows/oidc-device-authorization-v6',
        'rar': '/flows/rar',
        'rar-v5': '/flows/rar-v5',
        'rar-v6': '/flows/rar-v6',
        'ciba': '/flows/ciba',
        'ciba-v6': '/flows/ciba-v6',
        'pingone-mfa': '/flows/pingone-mfa',
        'pingone-mfa-v5': '/flows/pingone-mfa-v5',
        'pingone-mfa-v6': '/flows/pingone-mfa-v6',
        'worker-token': '/flows/worker-token',
        'worker-token-v5': '/flows/worker-token-v5'
      };

      let basePath = basePathMap[flowType] || '/dashboard';
      
      // Add step if provided
      if (stepId) {
        basePath += `?step=${encodeURIComponent(stepId)}`;
      }

      // Add additional parameters
      if (additionalParams) {
        const params = new URLSearchParams(stepId ? basePath.split('?')[1] || '' : '');
        Object.entries(additionalParams).forEach(([key, value]) => {
          params.set(key, value);
        });
        
        const paramString = params.toString();
        if (paramString) {
          basePath = basePath.split('?')[0] + '?' + paramString;
        }
      }

      console.log(`[FlowContextService] Built return path for ${flowType}:`, basePath);
      return basePath;
    } catch (error) {
      console.error('[FlowContextService] Failed to build return path:', error);
      return '/dashboard';
    }
  }

  /**
   * Validate flow context structure and content
   */
  static validateFlowContext(context: FlowContext): FlowContextValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Required fields validation
      if (!context.flowType || typeof context.flowType !== 'string') {
        errors.push('flowType is required and must be a string');
      }

      if (typeof context.currentStep !== 'number' || context.currentStep < 0) {
        errors.push('currentStep must be a non-negative number');
      }

      if (!context.returnPath || typeof context.returnPath !== 'string') {
        errors.push('returnPath is required and must be a string');
      }

      if (!context.flowState || typeof context.flowState !== 'object') {
        errors.push('flowState is required and must be an object');
      }

      if (typeof context.timestamp !== 'number' || context.timestamp <= 0) {
        errors.push('timestamp must be a positive number');
      }

      // Security validations
      if (context.returnPath && !this.isValidReturnPath(context.returnPath)) {
        errors.push('returnPath contains invalid characters or patterns');
      }

      // Size validation
      const contextSize = JSON.stringify(context).length;
      if (contextSize > this.MAX_CONTEXT_SIZE) {
        errors.push(`Context size (${contextSize}) exceeds maximum allowed (${this.MAX_CONTEXT_SIZE})`);
      }

      // Age validation
      if (context.timestamp && this.isContextExpired(context)) {
        warnings.push('Context is older than maximum allowed age');
      }

      // Flow type validation
      if (context.flowType && !this.isValidFlowType(context.flowType)) {
        warnings.push(`Unknown flow type: ${context.flowType}`);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      };
    }
  }

  /**
   * Handle redirect return with flow context
   */
  static handleRedirectReturn(callbackData: any): RedirectResult {
    try {
      const context = this.getFlowContext();
      
      if (!context) {
        console.log('[FlowContextService] No flow context found, using default redirect');
        return {
          success: true,
          redirectUrl: '/dashboard'
        };
      }

      // Validate context security
      if (!this.validateRedirectSecurity(context)) {
        console.warn('[FlowContextService] Security validation failed, using safe redirect');
        this.clearFlowContext();
        return {
          success: true,
          redirectUrl: '/dashboard'
        };
      }

      // Build redirect URL from context
      let redirectUrl = context.returnPath;

      // Add callback parameters if needed
      if (callbackData && typeof callbackData === 'object') {
        const url = new URL(redirectUrl, window.location.origin);
        
        // Add safe callback parameters
        const safeParams = ['code', 'state', 'session_state', 'iss'];
        safeParams.forEach(param => {
          if (callbackData[param] && typeof callbackData[param] === 'string') {
            url.searchParams.set(param, callbackData[param]);
          }
        });

        redirectUrl = url.pathname + url.search;
      }

      // Clean up context after successful redirect
      this.clearFlowContext();

      console.log('[FlowContextService] Redirect return successful:', {
        flowType: context.flowType,
        redirectUrl
      });

      return {
        success: true,
        redirectUrl
      };
    } catch (error) {
      console.error('[FlowContextService] Failed to handle redirect return:', error);
      return {
        success: false,
        redirectUrl: '/dashboard',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate redirect security
   */
  static validateRedirectSecurity(context: FlowContext): boolean {
    try {
      // Check context age
      if (this.isContextExpired(context)) {
        return false;
      }

      // Validate return path
      if (!this.isValidReturnPath(context.returnPath)) {
        return false;
      }

      // Check for suspicious patterns
      const suspiciousPatterns = [
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /<script/i,
        /on\w+=/i
      ];

      const contextString = JSON.stringify(context);
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(contextString)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[FlowContextService] Security validation error:', error);
      return false;
    }
  }

  // Private helper methods

  private static getStorageKey(flowType: string): string {
    // Use token management context for flows that navigate to token management
    const tokenManagementFlows = [
      'authorization-code-v5',
      'client-credentials-v5',
      'device-authorization-v6',
      'oidc-device-authorization-v6',
      'rar-v5',
      'rar-v6',
      'ciba-v6',
      'pingone-mfa-v5',
      'pingone-mfa-v6',
      'worker-token-v5'
    ];

    if (tokenManagementFlows.includes(flowType)) {
      return this.TOKEN_MANAGEMENT_CONTEXT_KEY;
    }

    if (flowType === 'implicit-v3') {
      return 'implicit_flow_v3_context';
    }

    return this.FLOW_CONTEXT_KEY;
  }

  private static isContextExpired(context: FlowContext): boolean {
    return Date.now() - context.timestamp > this.MAX_CONTEXT_AGE_MS;
  }

  private static isValidReturnPath(path: string): boolean {
    try {
      // Must start with /
      if (!path.startsWith('/')) {
        return false;
      }

      // Must not contain dangerous patterns
      const dangerousPatterns = [
        /\.\./,  // Path traversal
        /\/\//,  // Protocol relative URLs
        /[<>'"]/,  // HTML/JS injection
        /javascript:/i,
        /data:/i,
        /vbscript:/i
      ];

      return !dangerousPatterns.some(pattern => pattern.test(path));
    } catch (error) {
      return false;
    }
  }

  private static isValidFlowType(flowType: string): boolean {
    const validFlowTypes = [
      'authorization-code',
      'authorization-code-v3',
      'authorization-code-v5',
      'implicit',
      'implicit-v3',
      'client-credentials',
      'client-credentials-v5',
      'device-authorization',
      'device-authorization-v6',
      'oidc-device-authorization',
      'oidc-device-authorization-v6',
      'rar',
      'rar-v5',
      'rar-v6',
      'ciba',
      'ciba-v6',
      'pingone-mfa',
      'pingone-mfa-v5',
      'pingone-mfa-v6',
      'worker-token',
      'worker-token-v5'
    ];

    return validFlowTypes.includes(flowType);
  }

  private static generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Utility method to safely parse JSON
   */
  static safeJsonParse(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('[FlowContextService] Failed to parse JSON:', error);
      return null;
    }
  }

  /**
   * Create flow context for a specific flow
   */
  static createFlowContext(
    flowType: string,
    returnPath: string,
    currentStep: number = 0,
    flowState: Record<string, any> = {},
    credentials?: FlowContext['credentials']
  ): FlowContext {
    return {
      flowType,
      returnPath,
      currentStep,
      flowState,
      timestamp: Date.now(),
      credentials
    };
  }

  /**
   * Update existing flow context
   */
  static updateFlowContext(
    flowId: string,
    updates: Partial<FlowContext>
  ): boolean {
    const existingContext = this.getFlowContext(flowId);
    if (!existingContext) {
      return false;
    }

    const updatedContext: FlowContext = {
      ...existingContext,
      ...updates,
      timestamp: Date.now() // Always update timestamp
    };

    return this.saveFlowContext(flowId, updatedContext);
  }
}

export default FlowContextService;