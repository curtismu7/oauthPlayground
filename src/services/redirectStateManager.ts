// src/services/redirectStateManager.ts
// Redirect State Manager for preserving flow state across redirects

import FlowContextService, { type FlowContext } from './flowContextService';

export interface FlowState {
  credentials?: {
    environmentId: string;
    clientId: string;
    clientSecret?: string;
    redirectUri?: string;
    scopes?: string;
  };
  currentStep: number;
  formData?: Record<string, any>;
  tokens?: any;
  authUrl?: string;
  authCode?: string;
  deviceCode?: string;
  userCode?: string;
  verificationUri?: string;
  interval?: number;
  expiresIn?: number;
  [key: string]: any;
}

export interface RedirectResult {
  success: boolean;
  redirectUrl: string;
  error?: string;
  flowState?: FlowState;
}

export interface CallbackData {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
  session_state?: string;
  iss?: string;
  [key: string]: any;
}

/**
 * RedirectStateManager - Manages flow state preservation across OAuth redirects
 * 
 * This class works with FlowContextService to ensure that:
 * 1. Flow state is preserved when users are redirected to PingOne
 * 2. Users return to the correct flow step after authentication
 * 3. All flow data (credentials, tokens, etc.) is maintained
 * 4. Security is maintained through validation and cleanup
 */
export class RedirectStateManager {
  private static readonly FLOW_STATE_PREFIX = 'flow_state_';
  private static readonly MAX_STATE_AGE_MS = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_STATE_SIZE = 100000; // 100KB limit

  /**
   * Preserve flow state before redirect
   */
  static preserveFlowState(flowId: string, state: FlowState): boolean {
    try {
      // Validate state size
      const stateString = JSON.stringify(state);
      if (stateString.length > this.MAX_STATE_SIZE) {
        console.warn('[RedirectStateManager] Flow state exceeds size limit');
        return false;
      }

      // Add timestamp for expiration
      const preservedState = {
        ...state,
        _timestamp: Date.now(),
        _flowId: flowId
      };

      const stateKey = this.getStateKey(flowId);
      sessionStorage.setItem(stateKey, JSON.stringify(preservedState));

      console.log(`[RedirectStateManager] Preserved flow state for ${flowId}:`, {
        currentStep: state.currentStep,
        hasCredentials: !!state.credentials,
        hasTokens: !!state.tokens,
        stateSize: stateString.length
      });

      return true;
    } catch (error) {
      console.error('[RedirectStateManager] Failed to preserve flow state:', error);
      return false;
    }
  }

  /**
   * Restore flow state after redirect
   */
  static restoreFlowState(flowId: string): FlowState | null {
    try {
      const stateKey = this.getStateKey(flowId);
      const stateString = sessionStorage.getItem(stateKey);

      if (!stateString) {
        console.log(`[RedirectStateManager] No preserved state found for ${flowId}`);
        return null;
      }

      const preservedState = JSON.parse(stateString);

      // Check expiration
      if (preservedState._timestamp && Date.now() - preservedState._timestamp > this.MAX_STATE_AGE_MS) {
        console.warn(`[RedirectStateManager] Preserved state for ${flowId} has expired`);
        this.clearFlowState(flowId);
        return null;
      }

      // Remove internal fields
      const { _timestamp, _flowId, ...flowState } = preservedState;

      console.log(`[RedirectStateManager] Restored flow state for ${flowId}:`, {
        currentStep: flowState.currentStep,
        hasCredentials: !!flowState.credentials,
        hasTokens: !!flowState.tokens,
        age: Date.now() - (preservedState._timestamp || 0)
      });

      return flowState;
    } catch (error) {
      console.error('[RedirectStateManager] Failed to restore flow state:', error);
      return null;
    }
  }

  /**
   * Clear preserved flow state
   */
  static clearFlowState(flowId: string): void {
    try {
      const stateKey = this.getStateKey(flowId);
      sessionStorage.removeItem(stateKey);
      console.log(`[RedirectStateManager] Cleared flow state for ${flowId}`);
    } catch (error) {
      console.error('[RedirectStateManager] Failed to clear flow state:', error);
    }
  }

  /**
   * Handle redirect return with callback data
   */
  static handleRedirectReturn(callbackData: CallbackData): RedirectResult {
    try {
      // Get flow context to determine where to redirect
      const flowContext = FlowContextService.getFlowContext();
      
      if (!flowContext) {
        console.log('[RedirectStateManager] No flow context found for redirect return');
        return {
          success: true,
          redirectUrl: '/dashboard'
        };
      }

      // Validate security
      if (!this.validateRedirectSecurity(flowContext, callbackData)) {
        console.warn('[RedirectStateManager] Security validation failed');
        FlowContextService.clearFlowContext();
        return {
          success: false,
          redirectUrl: '/dashboard',
          error: 'Security validation failed'
        };
      }

      // Try to restore flow state
      const flowState = this.restoreFlowState(flowContext.metadata?.flowId || flowContext.flowType);

      // Handle OAuth errors
      if (callbackData.error) {
        console.warn('[RedirectStateManager] OAuth error in callback:', callbackData.error);
        
        // Build error redirect URL
        const errorUrl = this.buildErrorRedirectUrl(flowContext, callbackData);
        
        return {
          success: false,
          redirectUrl: errorUrl,
          error: callbackData.error_description || callbackData.error,
          flowState
        };
      }

      // Build success redirect URL
      const redirectUrl = this.buildSuccessRedirectUrl(flowContext, callbackData);

      // Clean up after successful redirect
      this.clearFlowState(flowContext.metadata?.flowId || flowContext.flowType);
      FlowContextService.clearFlowContext();

      console.log('[RedirectStateManager] Redirect return successful:', {
        flowType: flowContext.flowType,
        redirectUrl,
        hasFlowState: !!flowState
      });

      return {
        success: true,
        redirectUrl,
        flowState
      };
    } catch (error) {
      console.error('[RedirectStateManager] Failed to handle redirect return:', error);
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
  static validateRedirectSecurity(context: FlowContext, callbackData: CallbackData): boolean {
    try {
      // Validate flow context
      const contextValidation = FlowContextService.validateFlowContext(context);
      if (!contextValidation.valid) {
        console.warn('[RedirectStateManager] Invalid flow context:', contextValidation.errors);
        return false;
      }

      // Validate callback data
      if (callbackData && typeof callbackData === 'object') {
        // Check for XSS patterns in callback data
        const dangerousPatterns = [
          /<script/i,
          /javascript:/i,
          /data:/i,
          /vbscript:/i,
          /on\w+=/i
        ];

        const callbackString = JSON.stringify(callbackData);
        for (const pattern of dangerousPatterns) {
          if (pattern.test(callbackString)) {
            console.warn('[RedirectStateManager] Dangerous pattern detected in callback data');
            return false;
          }
        }

        // Validate state parameter if present
        if (callbackData.state && typeof callbackData.state === 'string') {
          if (callbackData.state.length > 1000) {
            console.warn('[RedirectStateManager] State parameter too long');
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('[RedirectStateManager] Security validation error:', error);
      return false;
    }
  }

  /**
   * Create redirect context for OAuth flow
   */
  static createRedirectContext(
    flowType: string,
    flowId: string,
    currentStep: number,
    flowState: FlowState
  ): boolean {
    try {
      // Build return path
      const returnPath = FlowContextService.buildReturnPath(flowType, currentStep.toString());

      // Create flow context
      const flowContext = FlowContextService.createFlowContext(
        flowType,
        returnPath,
        currentStep,
        { step: currentStep },
        flowState.credentials
      );

      // Save flow context
      const contextSaved = FlowContextService.saveFlowContext(flowId, flowContext);
      if (!contextSaved) {
        return false;
      }

      // Preserve flow state
      const stateSaved = this.preserveFlowState(flowId, flowState);
      if (!stateSaved) {
        FlowContextService.clearFlowContext(flowId);
        return false;
      }

      console.log(`[RedirectStateManager] Created redirect context for ${flowType}:`, {
        flowId,
        currentStep,
        returnPath
      });

      return true;
    } catch (error) {
      console.error('[RedirectStateManager] Failed to create redirect context:', error);
      return false;
    }
  }

  /**
   * Clean up expired states
   */
  static cleanupExpiredStates(): void {
    try {
      const keysToRemove: string[] = [];

      // Check all session storage keys
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.FLOW_STATE_PREFIX)) {
          try {
            const stateString = sessionStorage.getItem(key);
            if (stateString) {
              const state = JSON.parse(stateString);
              if (state._timestamp && Date.now() - state._timestamp > this.MAX_STATE_AGE_MS) {
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            // Invalid JSON, mark for removal
            keysToRemove.push(key);
          }
        }
      }

      // Remove expired states
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`[RedirectStateManager] Cleaned up expired state: ${key}`);
      });

      if (keysToRemove.length > 0) {
        console.log(`[RedirectStateManager] Cleaned up ${keysToRemove.length} expired states`);
      }
    } catch (error) {
      console.error('[RedirectStateManager] Failed to cleanup expired states:', error);
    }
  }

  // Private helper methods

  private static getStateKey(flowId: string): string {
    return `${this.FLOW_STATE_PREFIX}${flowId}`;
  }

  private static buildSuccessRedirectUrl(context: FlowContext, callbackData: CallbackData): string {
    try {
      const url = new URL(context.returnPath, window.location.origin);

      // Add callback parameters
      if (callbackData.code) {
        url.searchParams.set('code', callbackData.code);
      }
      if (callbackData.state) {
        url.searchParams.set('state', callbackData.state);
      }
      if (callbackData.session_state) {
        url.searchParams.set('session_state', callbackData.session_state);
      }
      if (callbackData.iss) {
        url.searchParams.set('iss', callbackData.iss);
      }

      return url.pathname + url.search;
    } catch (error) {
      console.error('[RedirectStateManager] Failed to build success redirect URL:', error);
      return context.returnPath;
    }
  }

  private static buildErrorRedirectUrl(context: FlowContext, callbackData: CallbackData): string {
    try {
      const url = new URL(context.returnPath, window.location.origin);

      // Add error parameters
      if (callbackData.error) {
        url.searchParams.set('error', callbackData.error);
      }
      if (callbackData.error_description) {
        url.searchParams.set('error_description', callbackData.error_description);
      }
      if (callbackData.state) {
        url.searchParams.set('state', callbackData.state);
      }

      return url.pathname + url.search;
    } catch (error) {
      console.error('[RedirectStateManager] Failed to build error redirect URL:', error);
      return context.returnPath;
    }
  }
}

export default RedirectStateManager;