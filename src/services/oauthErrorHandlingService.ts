// src/services/oauthErrorHandlingService.ts
// Comprehensive OAuth Error Handling Service for consistent error messages across all flows

export interface OAuthErrorDetails {
  message: string;
  troubleshootingSteps: string;
  errorType: 'invalid_credentials' | 'forbidden' | 'not_found' | 'network' | 'server_error' | 'invalid_grant' | 'invalid_scope' | 'unauthorized_client' | 'unsupported_grant_type' | 'unknown';
  recoveryActions: string[];
  correlationId?: string;
}

export interface OAuthErrorContext {
  flowType: 'authorization_code' | 'implicit' | 'client_credentials' | 'device_authorization' | 'hybrid' | 'token_exchange' | 'mfa' | 'unknown';
  stepId?: string;
  operation?: string;
  credentials?: {
    hasClientId: boolean;
    hasClientSecret: boolean;
    hasEnvironmentId: boolean;
    hasRedirectUri?: boolean;
    hasScope?: boolean;
  };
  metadata?: Record<string, any>;
}

export class OAuthErrorHandlingService {
  private static generateCorrelationId(): string {
    return `oauth-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Parse OAuth error and return user-friendly details
   */
  static parseOAuthError(error: any, context: OAuthErrorContext): OAuthErrorDetails {
    const correlationId = this.generateCorrelationId();
    const errorMessage = this.extractErrorMessage(error);
    const errorType = this.classifyError(errorMessage, error);
    
    return {
      message: this.getUserFriendlyMessage(errorType, context),
      troubleshootingSteps: this.getTroubleshootingSteps(errorType, context),
      errorType,
      recoveryActions: this.getRecoveryActions(errorType, context),
      correlationId
    };
  }

  /**
   * Extract error message from various error formats
   */
  private static extractErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error_description) return error.error_description;
    if (error?.error) return error.error;
    if (error?.statusText) return error.statusText;
    return 'Unknown error occurred';
  }

  /**
   * Classify error type based on message content
   */
  private static classifyError(errorMessage: string, originalError: any): OAuthErrorDetails['errorType'] {
    const message = errorMessage.toLowerCase();
    
    // HTTP Status Code based classification
    if (originalError?.status === 401 || message.includes('401') || message.includes('unauthorized')) {
      if (message.includes('invalid_client')) return 'invalid_credentials';
      return 'invalid_credentials';
    }
    
    if (originalError?.status === 403 || message.includes('403') || message.includes('forbidden')) {
      return 'forbidden';
    }
    
    if (originalError?.status === 404 || message.includes('404') || message.includes('not found')) {
      return 'not_found';
    }
    
    if (originalError?.status >= 500 || message.includes('server error') || message.includes('internal error')) {
      return 'server_error';
    }
    
    // OAuth specific error codes
    if (message.includes('invalid_grant')) return 'invalid_grant';
    if (message.includes('invalid_scope')) return 'invalid_scope';
    if (message.includes('unauthorized_client')) return 'unauthorized_client';
    if (message.includes('unsupported_grant_type')) return 'unsupported_grant_type';
    
    // Network related
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    
    return 'unknown';
  }

  /**
   * Get user-friendly error message based on error type and context
   */
  private static getUserFriendlyMessage(errorType: OAuthErrorDetails['errorType'], context: OAuthErrorContext): string {
    const flowName = this.getFlowDisplayName(context.flowType);
    
    switch (errorType) {
      case 'invalid_credentials':
        return `❌ Invalid Client Credentials`;
      case 'forbidden':
        return `❌ Access Forbidden`;
      case 'not_found':
        return `❌ Environment Not Found`;
      case 'network':
        return `❌ Network Connection Error`;
      case 'server_error':
        return `❌ PingOne Server Error`;
      case 'invalid_grant':
        return `❌ Invalid Authorization Code`;
      case 'invalid_scope':
        return `❌ Invalid Scope Requested`;
      case 'unauthorized_client':
        return `❌ Client Not Authorized`;
      case 'unsupported_grant_type':
        return `❌ Grant Type Not Supported`;
      default:
        return `❌ ${flowName} Request Failed`;
    }
  }

  /**
   * Get troubleshooting steps based on error type and flow context
   */
  private static getTroubleshootingSteps(errorType: OAuthErrorDetails['errorType'], context: OAuthErrorContext): string {
    const flowName = this.getFlowDisplayName(context.flowType);
    
    switch (errorType) {
      case 'invalid_credentials':
        return this.getInvalidCredentialsSteps(context);
      case 'forbidden':
        return this.getForbiddenSteps(context);
      case 'not_found':
        return this.getNotFoundSteps(context);
      case 'network':
        return this.getNetworkErrorSteps();
      case 'server_error':
        return this.getServerErrorSteps();
      case 'invalid_grant':
        return this.getInvalidGrantSteps(context);
      case 'invalid_scope':
        return this.getInvalidScopeSteps(context);
      case 'unauthorized_client':
        return this.getUnauthorizedClientSteps(context);
      case 'unsupported_grant_type':
        return this.getUnsupportedGrantTypeSteps(context);
      default:
        return this.getGenericErrorSteps(flowName);
    }
  }

  /**
   * Get recovery actions based on error type
   */
  private static getRecoveryActions(errorType: OAuthErrorDetails['errorType'], context: OAuthErrorContext): string[] {
    const baseActions = ['Check credentials', 'Verify configuration', 'Try again'];
    
    switch (errorType) {
      case 'invalid_credentials':
        return ['Verify Client ID', 'Check Client Secret', 'Confirm Environment ID', 'Copy from PingOne Console'];
      case 'forbidden':
        return ['Check application scopes', 'Verify permissions', 'Contact administrator'];
      case 'not_found':
        return ['Verify Environment ID', 'Check PingOne region', 'Confirm environment status'];
      case 'network':
        return ['Check internet connection', 'Verify firewall settings', 'Try again later'];
      case 'server_error':
        return ['Wait and retry', 'Check PingOne status', 'Contact support'];
      case 'invalid_grant':
        return ['Restart the flow', 'Get new authorization code', 'Check code expiration'];
      case 'invalid_scope':
        return ['Check requested scopes', 'Verify application scopes', 'Update scope configuration'];
      case 'unauthorized_client':
        return ['Check grant types', 'Verify application type', 'Update PingOne configuration'];
      case 'unsupported_grant_type':
        return ['Check grant type', 'Verify application configuration', 'Update PingOne settings'];
      default:
        return baseActions;
    }
  }

  /**
   * Flow-specific troubleshooting steps
   */
  private static getInvalidCredentialsSteps(context: OAuthErrorContext): string {
    const baseSteps = `
🔧 **Troubleshooting Steps:**

1. **Check Environment ID**: Make sure you're using the correct PingOne Environment ID
   - Should look like: \`4c8b3c31-4555-4fab-8ea6-c547da629e3d\`
   - Find it in PingOne Admin Console → Environments

2. **Verify Client ID**: Ensure your Client ID is correct
   - Should be different from your Environment ID
   - Find it in PingOne Admin Console → Applications → Your App → General

3. **Check Client Secret**: Verify your Client Secret is correct
   - Should not be empty or placeholder text
   - Find it in PingOne Admin Console → Applications → Your App → General → Client Secret

4. **Application Type**: Ensure your application is configured as:
   - **Application Type**: "Web Application" or "Service"
   - **Grant Types**: "${this.getRequiredGrantTypes(context.flowType)}" must be enabled
   - **Scopes**: Must include required scopes for this flow

5. **Environment Status**: Verify your PingOne environment is active and not suspended

💡 **Quick Test**: Try copying your credentials directly from PingOne Admin Console to avoid typos.`;

    // Add flow-specific guidance
    if (context.flowType === 'authorization_code' || context.flowType === 'implicit') {
      return baseSteps + `

6. **Redirect URI**: Ensure your redirect URI is correctly configured
   - Must match exactly: \`https://localhost:3000/authz-callback\`
   - Check PingOne Admin Console → Applications → Your App → General → Redirect URIs`;
    }

    if (context.flowType === 'device_authorization') {
      return baseSteps + `

6. **Device Flow Scopes**: Ensure your application has device authorization scopes
   - Required: \`p1:read:user\`, \`p1:update:user\`, \`p1:read:device\`, \`p1:update:device\`
   - Check PingOne Admin Console → Applications → Your App → Scopes`;
    }

    return baseSteps;
  }

  private static getForbiddenSteps(context: OAuthErrorContext): string {
    return `
🔧 **Troubleshooting Steps:**

1. **Check Scopes**: Your application may not have the required scopes
   - Required: ${this.getRequiredScopes(context.flowType)}
   - Add these in PingOne Admin Console → Applications → Your App → Scopes

2. **Application Permissions**: Ensure your application has the required permissions
   - Check PingOne Admin Console → Applications → Your App → Permissions

3. **Environment Access**: Verify you have access to this PingOne environment

4. **User Permissions**: Ensure your user account has the necessary permissions`;
  }

  private static getNotFoundSteps(context: OAuthErrorContext): string {
    return `
🔧 **Troubleshooting Steps:**

1. **Check Environment ID**: The Environment ID may be incorrect
   - Verify in PingOne Admin Console → Environments
   - Make sure you're using the correct region (US, EU, AP)

2. **Region Mismatch**: Ensure you're using the correct PingOne region
   - US: \`auth.pingone.com\`
   - EU: \`auth.pingone.eu\`
   - AP: \`auth.pingone.asia\`

3. **Environment Status**: Verify your PingOne environment is active and not suspended`;
  }

  private static getNetworkErrorSteps(): string {
    return `
🔧 **Troubleshooting Steps:**

1. **Check Internet Connection**: Ensure you have a stable internet connection

2. **Firewall/Proxy**: Check if your network blocks PingOne endpoints
   - Try accessing: \`https://auth.pingone.com\`

3. **CORS Issues**: If running locally, ensure CORS is properly configured

4. **Retry**: Sometimes network issues are temporary - try again in a few moments`;
  }

  private static getServerErrorSteps(): string {
    return `
🔧 **Troubleshooting Steps:**

1. **Wait and Retry**: Server errors are often temporary
   - Wait 1-2 minutes and try again

2. **Check PingOne Status**: Visit PingOne status page for known issues
   - https://status.pingidentity.com/

3. **Contact Support**: If the issue persists, contact PingOne support

4. **Alternative Region**: Try using a different PingOne region if available`;
  }

  private static getInvalidGrantSteps(context: OAuthErrorContext): string {
    return `
🔧 **Troubleshooting Steps:**

1. **Authorization Code Expired**: Authorization codes expire quickly (usually 10 minutes)
   - Restart the flow to get a new authorization code

2. **Code Already Used**: Authorization codes can only be used once
   - Get a new authorization code by restarting the flow

3. **Invalid Code**: The authorization code may be corrupted
   - Copy the code directly from the URL without modifications

4. **Flow Restart**: Click "Start Over" to begin a fresh authorization flow`;
  }

  private static getInvalidScopeSteps(context: OAuthErrorContext): string {
    return `
🔧 **Troubleshooting Steps:**

1. **Check Requested Scopes**: Verify the scopes you're requesting are valid
   - Required: ${this.getRequiredScopes(context.flowType)}

2. **Application Scopes**: Ensure your application is configured with these scopes
   - Check PingOne Admin Console → Applications → Your App → Scopes

3. **Scope Format**: Ensure scopes are space-separated (not comma-separated)
   - Correct: \`openid profile email\`
   - Incorrect: \`openid,profile,email\`

4. **PingOne Requirements**: Remember PingOne requires \`openid\` scope for all flows`;
  }

  private static getUnauthorizedClientSteps(context: OAuthErrorContext): string {
    return `
🔧 **Troubleshooting Steps:**

1. **Grant Types**: Ensure your application supports the required grant types
   - Required: ${this.getRequiredGrantTypes(context.flowType)}
   - Check PingOne Admin Console → Applications → Your App → General → Grant Types

2. **Application Type**: Verify your application type supports this flow
   - Web Application: Supports Authorization Code, Implicit
   - Service: Supports Client Credentials
   - Native: Supports Authorization Code, Device Authorization

3. **Client Configuration**: Check your application configuration in PingOne Admin Console`;
  }

  private static getUnsupportedGrantTypeSteps(context: OAuthErrorContext): string {
    return `
🔧 **Troubleshooting Steps:**

1. **Grant Type**: Verify the grant type is correct for this flow
   - Expected: ${this.getRequiredGrantTypes(context.flowType)}

2. **Application Configuration**: Ensure your application supports this grant type
   - Check PingOne Admin Console → Applications → Your App → General → Grant Types

3. **Flow Type**: Verify you're using the correct flow for your use case
   - Authorization Code: For web applications with server-side token exchange
   - Implicit: For single-page applications (deprecated)
   - Client Credentials: For machine-to-machine authentication
   - Device Authorization: For devices with limited input capabilities`;
  }

  private static getGenericErrorSteps(flowName: string): string {
    return `
🔧 **Troubleshooting Steps:**

1. **Check All Credentials**: Verify Environment ID, Client ID, and Client Secret
2. **Application Configuration**: Ensure all required settings are configured
3. **Required Scopes**: Make sure your app has the necessary scopes
4. **Environment Status**: Verify your PingOne environment is active

💡 **Need Help?** Check the PingOne documentation or contact your PingOne administrator.`;
  }

  /**
   * Helper methods for flow-specific information
   */
  private static getFlowDisplayName(flowType: OAuthErrorContext['flowType']): string {
    switch (flowType) {
      case 'authorization_code': return 'Authorization Code Flow';
      case 'implicit': return 'Implicit Flow';
      case 'client_credentials': return 'Client Credentials Flow';
      case 'device_authorization': return 'Device Authorization Flow';
      case 'hybrid': return 'OIDC Hybrid Flow';
      case 'token_exchange': return 'Token Exchange Flow';
      case 'mfa': return 'MFA Flow';
      default: return 'OAuth Flow';
    }
  }

  private static getRequiredGrantTypes(flowType: OAuthErrorContext['flowType']): string {
    switch (flowType) {
      case 'authorization_code': return 'Authorization Code';
      case 'implicit': return 'Implicit';
      case 'client_credentials': return 'Client Credentials';
      case 'device_authorization': return 'Device Authorization';
      case 'hybrid': return 'Authorization Code, Implicit';
      case 'token_exchange': return 'Client Credentials';
      case 'mfa': return 'Client Credentials, Authorization Code';
      default: return 'varies by flow';
    }
  }

  private static getRequiredScopes(flowType: OAuthErrorContext['flowType']): string {
    switch (flowType) {
      case 'authorization_code': return '`openid profile email` (PingOne requires openid for all flows)';
      case 'implicit': return '`openid profile email` (PingOne requires openid for all flows)';
      case 'client_credentials': return '`p1:read:user p1:update:user` (or your API scopes)';
      case 'device_authorization': return '`openid profile email` (consistent for both OAuth and OIDC)';
      case 'hybrid': return '`openid profile email` (OIDC hybrid flows)';
      case 'token_exchange': return '`urn:ietf:params:oauth:token-exchange` (token exchange scope)';
      case 'mfa': return '`p1:read:user p1:update:user p1:read:device p1:update:device` (MFA operations)';
      default: return 'varies by flow';
    }
  }
}



