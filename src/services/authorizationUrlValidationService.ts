// src/services/authorizationUrlValidationService.ts
// Comprehensive service for validating OAuth/OIDC authorization URLs before sending

export interface UrlValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  parsedUrl: ParsedAuthorizationUrl | null;
  flowType: 'authorization-code' | 'implicit' | 'hybrid' | 'device' | 'unknown';
  severity: 'error' | 'warning' | 'info';
}

export interface ParsedAuthorizationUrl {
  baseUrl: string;
  responseType: string[];
  clientId: string;
  redirectUri: string;
  scope: string[];
  state?: string;
  nonce?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  loginHint?: string;
  prompt?: string;
  maxAge?: string;
  acrValues?: string[];
  customParams: Record<string, string>;
}

export interface UrlValidationConfig {
  flowType: 'authorization-code' | 'implicit' | 'hybrid' | 'device';
  requireOpenId?: boolean;
  requireState?: boolean;
  requireNonce?: boolean;
  requirePkce?: boolean;
  allowedResponseTypes?: string[];
  allowedScopes?: string[];
  customValidation?: (parsedUrl: ParsedAuthorizationUrl) => string[];
}

class AuthorizationUrlValidationService {
  private static instance: AuthorizationUrlValidationService;

  static getInstance(): AuthorizationUrlValidationService {
    if (!AuthorizationUrlValidationService.instance) {
      AuthorizationUrlValidationService.instance = new AuthorizationUrlValidationService();
    }
    return AuthorizationUrlValidationService.instance;
  }

  /**
   * Validate an authorization URL for a specific flow type
   */
  validateAuthorizationUrl(
    url: string,
    config: UrlValidationConfig
  ): UrlValidationResult {
    const result: UrlValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      parsedUrl: null,
      flowType: 'unknown',
      severity: 'info'
    };

    try {
      // Basic URL validation first
      this.validateBasicUrlStructure(url, result);
      
      // If basic validation failed, don't proceed with parsing
      if (result.errors.length > 0) {
        this.determineValidationResult(result);
        return result;
      }

      // Parse the URL
      const parsedUrl = this.parseAuthorizationUrl(url);
      result.parsedUrl = parsedUrl;
      result.flowType = this.detectFlowType(parsedUrl);
      
      // Flow-specific validation
      this.validateFlowSpecificRequirements(parsedUrl, config, result);
      
      // Scope validation
      this.validateScopes(parsedUrl.scope, config, result);
      
      // Security validation
      this.validateSecurityRequirements(parsedUrl, config, result);
      
      // PingOne-specific validation
      this.validatePingOneRequirements(parsedUrl, config, result);
      
      // Custom validation
      if (config.customValidation) {
        const customErrors = config.customValidation(parsedUrl);
        result.errors.push(...customErrors);
      }

      // Determine overall validity and severity
      this.determineValidationResult(result);

    } catch (error) {
      result.errors.push(`URL_VALIDATION_ERROR: ${error instanceof Error ? error.message : 'Failed to parse URL'}`);
      result.isValid = false;
      result.severity = 'error';
    }

    return result;
  }

  /**
   * Parse authorization URL into components
   */
  private parseAuthorizationUrl(url: string): ParsedAuthorizationUrl {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      return {
        baseUrl: `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`,
        responseType: params.get('response_type')?.split(/\s+/) || [],
        clientId: params.get('client_id') || '',
        redirectUri: params.get('redirect_uri') || '',
        scope: params.get('scope')?.split(/\s+/) || [],
        state: params.get('state') || undefined,
        nonce: params.get('nonce') || undefined,
        codeChallenge: params.get('code_challenge') || undefined,
        codeChallengeMethod: params.get('code_challenge_method') || undefined,
        loginHint: params.get('login_hint') || undefined,
        prompt: params.get('prompt') || undefined,
        maxAge: params.get('max_age') || undefined,
        acrValues: params.get('acr_values')?.split(/\s+/) || [],
        customParams: Object.fromEntries(
          Array.from(params.entries()).filter(([key]) => 
            !['response_type', 'client_id', 'redirect_uri', 'scope', 'state', 
              'nonce', 'code_challenge', 'code_challenge_method', 'login_hint', 
              'prompt', 'max_age', 'acr_values'].includes(key)
          )
        )
      };
    } catch (error) {
      throw new Error(`Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect flow type from parsed URL
   */
  private detectFlowType(parsedUrl: ParsedAuthorizationUrl): UrlValidationResult['flowType'] {
    const responseTypes = parsedUrl.responseType;
    
    if (responseTypes.includes('code') && responseTypes.includes('id_token')) {
      return 'hybrid';
    } else if (responseTypes.includes('code')) {
      return 'authorization-code';
    } else if (responseTypes.includes('token') || responseTypes.includes('id_token')) {
      return 'implicit';
    } else if (parsedUrl.baseUrl.includes('device_authorization')) {
      return 'device';
    }
    
    return 'unknown';
  }

  /**
   * Validate basic URL structure
   */
  private validateBasicUrlStructure(url: string, result: UrlValidationResult): void {
    // Check for empty or whitespace-only URLs
    if (!url || url.trim().length === 0) {
      result.errors.push('URL_VALIDATION_ERROR: URL is empty or contains only whitespace');
      return;
    }

    // Check if URL is valid
    try {
      new URL(url);
    } catch {
      result.errors.push('URL_VALIDATION_ERROR: Invalid URL format');
      return;
    }

    // Check if it's HTTPS (required for production)
    if (!url.startsWith('https://')) {
      result.warnings.push('URL_VALIDATION_WARNING: URL should use HTTPS for security');
    }

    // Check if it's a PingOne URL
    if (!url.includes('auth.pingone.com')) {
      result.warnings.push('URL_VALIDATION_WARNING: URL does not appear to be a PingOne authorization endpoint');
    }
  }

  /**
   * Validate flow-specific requirements
   */
  private validateFlowSpecificRequirements(
    parsedUrl: ParsedAuthorizationUrl,
    config: UrlValidationConfig,
    result: UrlValidationResult
  ): void {
    const { responseType, clientId, redirectUri } = parsedUrl;

    // Check required parameters
    if (!clientId) {
      result.errors.push('URL_VALIDATION_ERROR: Missing required parameter: client_id');
    }

    if (!redirectUri) {
      result.errors.push('URL_VALIDATION_ERROR: Missing required parameter: redirect_uri');
    }

    if (responseType.length === 0 && config.flowType !== 'device') {
      result.errors.push('URL_VALIDATION_ERROR: Missing required parameter: response_type');
    }

    // Validate response types based on flow (skip for device flow)
    if (config.flowType !== 'device') {
      const expectedResponseTypes = this.getExpectedResponseTypes(config.flowType);
      const invalidResponseTypes = responseType.filter(rt => !expectedResponseTypes.includes(rt));
      
      if (invalidResponseTypes.length > 0) {
        result.errors.push(`URL_VALIDATION_ERROR: Invalid response_type(s): ${invalidResponseTypes.join(', ')}`);
      }

      // Check for missing required response types
      const missingResponseTypes = expectedResponseTypes.filter(rt => !responseType.includes(rt));
      if (missingResponseTypes.length > 0) {
        result.errors.push(`URL_VALIDATION_ERROR: Missing required response_type(s): ${missingResponseTypes.join(', ')}`);
      }
    }
  }

  /**
   * Get expected response types for each flow
   */
  private getExpectedResponseTypes(flowType: string): string[] {
    switch (flowType) {
      case 'authorization-code':
        return ['code'];
      case 'implicit':
        return ['token', 'id_token'];
      case 'hybrid':
        return ['code', 'id_token'];
      case 'device':
        return []; // Device flow doesn't use response_type
      default:
        return [];
    }
  }

  /**
   * Validate scopes
   */
  private validateScopes(
    scopes: string[],
    config: UrlValidationConfig,
    result: UrlValidationResult
  ): void {
    if (scopes.length === 0) {
      result.errors.push('URL_VALIDATION_ERROR: No scopes specified');
      return;
    }

    // Check for openid scope requirement
    if (config.requireOpenId !== false && !scopes.includes('openid')) {
      result.errors.push('URL_VALIDATION_ERROR: Missing required scope: openid');
      result.suggestions.push('Add "openid" to the scope parameter for PingOne authorization flows');
    }

    // Check for invalid scopes
    const invalidScopes = scopes.filter(scope => !this.isValidScope(scope));
    if (invalidScopes.length > 0) {
      result.errors.push(`URL_VALIDATION_ERROR: Invalid scope(s): ${invalidScopes.join(', ')}`);
    }

    // Check for common scope issues
    if (scopes.includes('openid') && scopes.length === 1) {
      result.suggestions.push('Consider adding additional scopes like "profile" or "email" for more user information');
    }

    // Check for PingOne-specific scopes
    const pingOneScopes = scopes.filter(scope => scope.startsWith('p1:'));
    if (pingOneScopes.length > 0) {
      result.warnings.push(`URL_VALIDATION_WARNING: Using PingOne-specific scopes: ${pingOneScopes.join(', ')}`);
    }
  }

  /**
   * Validate security requirements
   */
  private validateSecurityRequirements(
    parsedUrl: ParsedAuthorizationUrl,
    config: UrlValidationConfig,
    result: UrlValidationResult
  ): void {
    // State parameter validation
    if (config.requireState !== false && !parsedUrl.state) {
      result.warnings.push('URL_VALIDATION_WARNING: Missing state parameter (recommended for security)');
      result.suggestions.push('Add a state parameter to prevent CSRF attacks');
    }

    // Nonce validation for OIDC flows
    if (config.requireNonce !== false && 
        (parsedUrl.responseType.includes('id_token') || config.flowType === 'hybrid') && 
        !parsedUrl.nonce) {
      result.warnings.push('URL_VALIDATION_WARNING: Missing nonce parameter (recommended for OIDC flows)');
      result.suggestions.push('Add a nonce parameter for enhanced security in OIDC flows');
    }

    // PKCE validation for authorization code flow
    if (config.requirePkce !== false && 
        config.flowType === 'authorization-code' && 
        (!parsedUrl.codeChallenge || !parsedUrl.codeChallengeMethod)) {
      result.warnings.push('URL_VALIDATION_WARNING: Missing PKCE parameters (recommended for security)');
      result.suggestions.push('Add code_challenge and code_challenge_method for PKCE security');
    }

    // Redirect URI validation
    if (parsedUrl.redirectUri && !parsedUrl.redirectUri.startsWith('https://')) {
      result.warnings.push('URL_VALIDATION_WARNING: Redirect URI should use HTTPS');
    }
  }

  /**
   * Validate PingOne-specific requirements
   */
  private validatePingOneRequirements(
    parsedUrl: ParsedAuthorizationUrl,
    config: UrlValidationConfig,
    result: UrlValidationResult
  ): void {
    // Check for PingOne-specific parameters
    if (parsedUrl.loginHint) {
      result.suggestions.push('Login hint provided - this will pre-populate the username field');
    }

    if (parsedUrl.prompt) {
      const validPrompts = ['login', 'consent', 'select_account', 'none'];
      if (!validPrompts.includes(parsedUrl.prompt)) {
        result.warnings.push(`URL_VALIDATION_WARNING: Invalid prompt value: ${parsedUrl.prompt}`);
      }
    }

    if (parsedUrl.maxAge) {
      const maxAge = parseInt(parsedUrl.maxAge);
      if (isNaN(maxAge) || maxAge < 0) {
        result.warnings.push(`URL_VALIDATION_WARNING: Invalid max_age value: ${parsedUrl.maxAge}`);
      }
    }
  }

  /**
   * Check if a scope is valid
   */
  private isValidScope(scope: string): boolean {
    if (!scope || scope.length === 0) return false;
    if (scope.length > 100) return false;
    
    // Allow alphanumeric, dots, colons, underscores, hyphens
    // Spaces are not allowed in individual scopes
    const scopeRegex = /^[a-zA-Z0-9._:-]+$/;
    return scopeRegex.test(scope);
  }

  /**
   * Determine overall validation result and severity
   */
  private determineValidationResult(result: UrlValidationResult): void {
    if (result.errors.length > 0) {
      result.isValid = false;
      result.severity = 'error';
    } else if (result.warnings.length > 0) {
      result.isValid = true;
      result.severity = 'warning';
    } else {
      result.isValid = true;
      result.severity = 'info';
    }
  }

  /**
   * Get validation summary for display
   */
  getValidationSummary(result: UrlValidationResult): {
    title: string;
    message: string;
    details: string[];
    canProceed: boolean;
  } {
    const { isValid, errors, warnings, suggestions, flowType } = result;
    
    let title: string;
    let message: string;
    let canProceed: boolean;

    if (!isValid) {
      title = '❌ Authorization URL Validation Failed';
      message = 'The authorization URL has errors that must be fixed before proceeding.';
      canProceed = false;
    } else if (warnings.length > 0) {
      title = '⚠️ Authorization URL Validation Warnings';
      message = 'The authorization URL has warnings but can proceed. Consider addressing these issues.';
      canProceed = true;
    } else {
      title = '✅ Authorization URL Validation Passed';
      message = 'The authorization URL is properly formatted and ready to use.';
      canProceed = true;
    }

    const details = [
      `Flow Type: ${flowType}`,
      ...errors.map(error => `❌ ${error}`),
      ...warnings.map(warning => `⚠️ ${warning}`),
      ...suggestions.map(suggestion => `💡 ${suggestion}`)
    ];

    return { title, message, details, canProceed };
  }

  /**
   * Quick validation for common issues
   */
  quickValidate(url: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    try {
      const parsedUrl = this.parseAuthorizationUrl(url);
      
      // Check for openid scope
      if (!parsedUrl.scope.includes('openid')) {
        issues.push('Missing required scope: openid');
      }
      
      // Check for client_id
      if (!parsedUrl.clientId) {
        issues.push('Missing required parameter: client_id');
      }
      
      // Check for redirect_uri
      if (!parsedUrl.redirectUri) {
        issues.push('Missing required parameter: redirect_uri');
      }
      
      // Check for response_type
      if (parsedUrl.responseType.length === 0) {
        issues.push('Missing required parameter: response_type');
      }
      
    } catch (error) {
      issues.push('Invalid URL format');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const authorizationUrlValidationService = AuthorizationUrlValidationService.getInstance();

// Export class for testing
export { AuthorizationUrlValidationService };

// Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).authorizationUrlValidationService = authorizationUrlValidationService;
  (window as any).validateAuthUrl = (url: string, flowType: string) => 
    authorizationUrlValidationService.validateAuthorizationUrl(url, { flowType: flowType as any });
  (window as any).quickValidateAuthUrl = (url: string) => 
    authorizationUrlValidationService.quickValidate(url);

  console.log('🔍 Authorization URL Validation Service loaded. Available commands:');
  console.log('  - validateAuthUrl(url, flowType) - Full URL validation');
  console.log('  - quickValidateAuthUrl(url) - Quick validation for common issues');
}
