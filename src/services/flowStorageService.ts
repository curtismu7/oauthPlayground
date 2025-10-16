// src/services/flowStorageService.ts
/**
 * Flow Storage Service
 * 
 * Centralized storage management for OAuth/OIDC flows.
 * Provides type-safe, consistent access to sessionStorage and localStorage
 * with standardized key naming conventions.
 * 
 * Key Naming Pattern: {storage}:{flow-id}:{data-type}:{sub-type?}
 * 
 * Examples:
 * - session:oauth-authz-v6:auth-code
 * - session:oidc-authz-v6:pkce:verifier
 * - local:device-auth:credentials
 * 
 * @module flowStorageService
 */

// ============================================
// Type Definitions
// ============================================

/**
 * Supported flow identifiers
 */
export type FlowId = 
  | 'oauth-authz-v6'
  | 'oidc-authz-v6'
  | 'oauth-authz-v7'
  | 'oidc-authz-v7'
  | 'oauth-implicit-v6'
  | 'oidc-implicit-v6'
  | 'oauth-implicit-v7'
  | 'oidc-implicit-v7'
  | 'oauth-device-auth-v6'
  | 'oidc-device-auth-v6'
  | 'oauth-device-auth-v7'
  | 'oidc-device-auth-v7'
  | 'client-credentials-v6'
  | 'jwt-bearer-v6'
  | 'saml-bearer-v6'
  | 'par-v6'
  | 'rar-v6'
  | 'redirectless-v6'
  | 'oauth-hybrid-v6'
  | 'oidc-hybrid-v6';

/**
 * Authorization code data with metadata
 */
export interface AuthCodeData {
  code: string;
  timestamp: number;
  expiresAt?: number;
}

/**
 * OAuth/OIDC state parameter data
 */
export interface StateData {
  state: string;
  timestamp: number;
}

/**
 * PKCE (Proof Key for Code Exchange) data
 */
export interface PKCEData {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256' | 'plain';
}

/**
 * Token data structure
 */
export interface TokenData {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  [key: string]: unknown;
}

/**
 * Credentials data structure
 */
export interface CredentialsData {
  environmentId: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string;
  [key: string]: unknown;
}

/**
 * Flow navigation context
 */
export interface FlowNavigationData {
  flowId: FlowId;
  currentStep: number;
  returnPath?: string;
  context?: Record<string, unknown>;
}

/**
 * Device code data (for Device Authorization Flow)
 */
export interface DeviceCodeData {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
  timestamp: number;
}

/**
 * Advanced OAuth/OIDC parameters data
 */
export interface AdvancedParametersData {
  audience?: string;
  resources?: string[];
  displayMode?: string;
  promptValues?: string[];
  claimsRequest?: Record<string, unknown> | null;
  // For future expansion
  uiLocales?: string;
  claimsLocales?: string;
  loginHint?: string;
  acrValues?: string[];
  maxAge?: number;
}

// ============================================
// Storage Keys Generator
// ============================================

/**
 * Centralized storage key generation
 * Ensures consistent naming across the application
 */
class StorageKeys {
  /**
   * Generate key for authorization code
   */
  static authCode(flowId: FlowId): string {
    return `session:${flowId}:auth-code`;
  }

  /**
   * Generate key for device code
   */
  static deviceCode(flowId: FlowId): string {
    return `session:${flowId}:device-code`;
  }

  /**
   * Generate key for OAuth/OIDC state
   */
  static state(flowId: FlowId): string {
    return `session:${flowId}:state`;
  }

  /**
   * Generate key for PKCE code verifier
   */
  static pkceVerifier(flowId: FlowId): string {
    return `session:${flowId}:pkce:verifier`;
  }

  /**
   * Generate key for PKCE code challenge
   */
  static pkceChallenge(flowId: FlowId): string {
    return `session:${flowId}:pkce:challenge`;
  }

  /**
   * Generate key for PKCE method
   */
  static pkceMethod(flowId: FlowId): string {
    return `session:${flowId}:pkce:method`;
  }

  /**
   * Generate key for current step
   */
  static currentStep(flowId: FlowId): string {
    return `session:${flowId}:current-step`;
  }

  /**
   * Generate key for flow credentials
   */
  static credentials(flowId: FlowId): string {
    return `local:${flowId}:credentials`;
  }

  /**
   * Key for secure token storage
   */
  static tokens(): string {
    return 'local:secure:tokens';
  }

  /**
   * Key for user info
   */
  static userInfo(): string {
    return 'local:global:user-info';
  }

  /**
   * Key for flow context
   */
  static flowContext(): string {
    return 'session:global:flow-context';
  }

  /**
   * Key for return path
   */
  static returnPath(): string {
    return 'session:global:return-path';
  }

  /**
   * Key for restore step
   */
  static restoreStep(): string {
    return 'session:global:restore-step';
  }

  /**
   * Generate key for advanced parameters
   */
  static advancedParameters(flowId: FlowId): string {
    return `local:${flowId}:advanced-params`;
  }
}

// ============================================
// Authorization Code Storage
// ============================================

/**
 * Manages authorization code storage
 */
export class AuthCodeStorage {
  /**
   * Store authorization code for a flow
   * @param flowId - The flow identifier
   * @param code - The authorization code
   */
  static set(flowId: FlowId, code: string): void {
    const data: AuthCodeData = {
      code,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(StorageKeys.authCode(flowId), JSON.stringify(data));
    console.log(`🔑 [FlowStorage] Stored auth code for ${flowId}`);
  }

  /**
   * Get authorization code for a flow
   * @param flowId - The flow identifier
   * @returns The authorization code or null if not found
   */
  static get(flowId: FlowId): string | null {
    const stored = sessionStorage.getItem(StorageKeys.authCode(flowId));
    if (!stored) return null;

    try {
      const data: AuthCodeData = JSON.parse(stored);
      return data.code;
    } catch (e) {
      console.warn(`[FlowStorage] Failed to parse auth code for ${flowId}`, e);
      return null;
    }
  }

  /**
   * Get full authorization code data (including metadata)
   * @param flowId - The flow identifier
   * @returns The auth code data or null if not found
   */
  static getData(flowId: FlowId): AuthCodeData | null {
    const stored = sessionStorage.getItem(StorageKeys.authCode(flowId));
    if (!stored) return null;

    try {
      return JSON.parse(stored) as AuthCodeData;
    } catch (e) {
      console.warn(`[FlowStorage] Failed to parse auth code data for ${flowId}`, e);
      return null;
    }
  }

  /**
   * Remove authorization code for a flow
   * @param flowId - The flow identifier
   */
  static remove(flowId: FlowId): void {
    sessionStorage.removeItem(StorageKeys.authCode(flowId));
    console.log(`🗑️ [FlowStorage] Removed auth code for ${flowId}`);
  }

  /**
   * Check if auth code exists and is fresh (< 5 minutes old by default)
   * @param flowId - The flow identifier
   * @param maxAgeMs - Maximum age in milliseconds (default: 5 minutes)
   * @returns True if code exists and is fresh
   */
  static isFresh(flowId: FlowId, maxAgeMs: number = 5 * 60 * 1000): boolean {
    const data = AuthCodeStorage.getData(flowId);
    if (!data) return false;

    const age = Date.now() - data.timestamp;
    return age < maxAgeMs;
  }
}

// ============================================
// Device Code Storage
// ============================================

/**
 * Manages device code storage (for Device Authorization Flow)
 */
export class DeviceCodeStorage {
  /**
   * Store device code data
   * @param flowId - The flow identifier
   * @param data - The device code data
   */
  static set(flowId: FlowId, data: DeviceCodeData): void {
    const dataWithTimestamp = {
      ...data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(StorageKeys.deviceCode(flowId), JSON.stringify(dataWithTimestamp));
    console.log(`📱 [FlowStorage] Stored device code for ${flowId}`);
  }

  /**
   * Get device code data
   * @param flowId - The flow identifier
   * @returns The device code data or null if not found
   */
  static get(flowId: FlowId): DeviceCodeData | null {
    const stored = sessionStorage.getItem(StorageKeys.deviceCode(flowId));
    if (!stored) return null;

    try {
      return JSON.parse(stored) as DeviceCodeData;
    } catch (e) {
      console.warn(`[FlowStorage] Failed to parse device code for ${flowId}`, e);
      return null;
    }
  }

  /**
   * Remove device code data
   * @param flowId - The flow identifier
   */
  static remove(flowId: FlowId): void {
    sessionStorage.removeItem(StorageKeys.deviceCode(flowId));
    console.log(`🗑️ [FlowStorage] Removed device code for ${flowId}`);
  }

  /**
   * Check if device code is expired
   * @param flowId - The flow identifier
   * @returns True if expired
   */
  static isExpired(flowId: FlowId): boolean {
    const data = DeviceCodeStorage.get(flowId);
    if (!data) return true;

    const age = Date.now() - data.timestamp;
    return age > data.expires_in * 1000;
  }
}

// ============================================
// State Management
// ============================================

/**
 * Manages OAuth/OIDC state parameter storage
 */
export class StateStorage {
  /**
   * Store state parameter
   * @param flowId - The flow identifier
   * @param state - The state value
   */
  static set(flowId: FlowId, state: string): void {
    const data: StateData = {
      state,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(StorageKeys.state(flowId), JSON.stringify(data));
    console.log(`🎲 [FlowStorage] Stored state for ${flowId}`);
  }

  /**
   * Get state parameter
   * @param flowId - The flow identifier
   * @returns The state value or null if not found
   */
  static get(flowId: FlowId): string | null {
    const stored = sessionStorage.getItem(StorageKeys.state(flowId));
    if (!stored) return null;

    try {
      const data: StateData = JSON.parse(stored);
      return data.state;
    } catch (e) {
      console.warn(`[FlowStorage] Failed to parse state for ${flowId}`, e);
      return null;
    }
  }

  /**
   * Remove state parameter
   * @param flowId - The flow identifier
   */
  static remove(flowId: FlowId): void {
    sessionStorage.removeItem(StorageKeys.state(flowId));
    console.log(`🗑️ [FlowStorage] Removed state for ${flowId}`);
  }
}

// ============================================
// PKCE Management
// ============================================

/**
 * Manages PKCE (Proof Key for Code Exchange) storage
 */
export class PKCEStorage {
  /**
   * Store PKCE data
   * @param flowId - The flow identifier
   * @param pkce - The PKCE data
   */
  static set(flowId: FlowId, pkce: PKCEData): void {
    sessionStorage.setItem(StorageKeys.pkceVerifier(flowId), pkce.codeVerifier);
    sessionStorage.setItem(StorageKeys.pkceChallenge(flowId), pkce.codeChallenge);
    sessionStorage.setItem(StorageKeys.pkceMethod(flowId), pkce.codeChallengeMethod);
    console.log(`🔐 [FlowStorage] Stored PKCE for ${flowId}`);
  }

  /**
   * Get PKCE data
   * @param flowId - The flow identifier
   * @returns The PKCE data or null if not found
   */
  static get(flowId: FlowId): PKCEData | null {
    const verifier = sessionStorage.getItem(StorageKeys.pkceVerifier(flowId));
    const challenge = sessionStorage.getItem(StorageKeys.pkceChallenge(flowId));
    const method = sessionStorage.getItem(StorageKeys.pkceMethod(flowId)) as 'S256' | 'plain' | null;

    if (!verifier || !challenge) return null;

    return {
      codeVerifier: verifier,
      codeChallenge: challenge,
      codeChallengeMethod: method || 'S256',
    };
  }

  /**
   * Remove PKCE data
   * @param flowId - The flow identifier
   */
  static remove(flowId: FlowId): void {
    sessionStorage.removeItem(StorageKeys.pkceVerifier(flowId));
    sessionStorage.removeItem(StorageKeys.pkceChallenge(flowId));
    sessionStorage.removeItem(StorageKeys.pkceMethod(flowId));
    console.log(`🗑️ [FlowStorage] Removed PKCE for ${flowId}`);
  }
}

// ============================================
// Flow State Management
// ============================================

/**
 * Manages flow state (current step, etc.)
 */
export class FlowStateStorage {
  /**
   * Set current step for a flow
   * @param flowId - The flow identifier
   * @param step - The step number
   */
  static setCurrentStep(flowId: FlowId, step: number): void {
    sessionStorage.setItem(StorageKeys.currentStep(flowId), step.toString());
    console.log(`📍 [FlowStorage] Set current step for ${flowId}: ${step}`);
  }

  /**
   * Get current step for a flow
   * @param flowId - The flow identifier
   * @returns The step number or null if not found
   */
  static getCurrentStep(flowId: FlowId): number | null {
    const stored = sessionStorage.getItem(StorageKeys.currentStep(flowId));
    if (!stored) return null;
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Remove current step for a flow
   * @param flowId - The flow identifier
   */
  static removeCurrentStep(flowId: FlowId): void {
    sessionStorage.removeItem(StorageKeys.currentStep(flowId));
    console.log(`🗑️ [FlowStorage] Removed current step for ${flowId}`);
  }
}

// ============================================
// Credentials Management
// ============================================

/**
 * Manages flow credentials (client ID, secret, etc.)
 */
export class CredentialsStorage {
  /**
   * Store credentials for a flow
   * @param flowId - The flow identifier
   * @param credentials - The credentials data
   */
  static set(flowId: FlowId, credentials: CredentialsData): void {
    localStorage.setItem(StorageKeys.credentials(flowId), JSON.stringify(credentials));
    console.log(`💾 [FlowStorage] Saved credentials for ${flowId}`);
  }

  /**
   * Get credentials for a flow
   * @param flowId - The flow identifier
   * @returns The credentials or null if not found
   */
  static get(flowId: FlowId): CredentialsData | null {
    const stored = localStorage.getItem(StorageKeys.credentials(flowId));
    if (!stored) return null;

    try {
      return JSON.parse(stored) as CredentialsData;
    } catch (e) {
      console.warn(`[FlowStorage] Failed to parse credentials for ${flowId}`, e);
      return null;
    }
  }

  /**
   * Remove credentials for a flow
   * @param flowId - The flow identifier
   */
  static remove(flowId: FlowId): void {
    localStorage.removeItem(StorageKeys.credentials(flowId));
    console.log(`🗑️ [FlowStorage] Removed credentials for ${flowId}`);
  }
}

// ============================================
// Token Management
// ============================================

/**
 * Manages secure token storage
 */
export class TokenStorage {
  /**
   * Store tokens securely
   * @param tokens - The token data
   */
  static set(tokens: TokenData): void {
    sessionStorage.setItem(StorageKeys.tokens(), JSON.stringify(tokens));
    console.log(`🎫 [FlowStorage] Stored tokens securely`);
  }

  /**
   * Get stored tokens
   * @returns The tokens or null if not found
   */
  static get(): TokenData | null {
    const stored = sessionStorage.getItem(StorageKeys.tokens());
    if (!stored) return null;

    try {
      return JSON.parse(stored) as TokenData;
    } catch (e) {
      console.warn(`[FlowStorage] Failed to parse tokens`, e);
      return null;
    }
  }

  /**
   * Remove stored tokens
   */
  static remove(): void {
    sessionStorage.removeItem(StorageKeys.tokens());
    console.log(`🗑️ [FlowStorage] Removed tokens`);
  }

  /**
   * Check if tokens are expired
   * @returns True if expired
   */
  static isExpired(): boolean {
    const tokens = TokenStorage.get();
    if (!tokens) return true;

    // Tokens don't have a stored timestamp, so we can't determine expiry
    // This would need to be enhanced with token storage timestamp
    return false;
  }
}

// ============================================
// Navigation Management
// ============================================

/**
 * Manages flow navigation and context
 */
export class NavigationStorage {
  /**
   * Store flow context
   * @param context - The flow navigation data
   */
  static setFlowContext(context: FlowNavigationData): void {
    sessionStorage.setItem(StorageKeys.flowContext(), JSON.stringify(context));
    console.log(`🧭 [FlowStorage] Set flow context: ${context.flowId}`);
  }

  /**
   * Get flow context
   * @returns The flow navigation data or null if not found
   */
  static getFlowContext(): FlowNavigationData | null {
    const stored = sessionStorage.getItem(StorageKeys.flowContext());
    if (!stored) return null;

    try {
      return JSON.parse(stored) as FlowNavigationData;
    } catch (e) {
      console.warn(`[FlowStorage] Failed to parse flow context`, e);
      return null;
    }
  }

  /**
   * Remove flow context
   */
  static removeFlowContext(): void {
    sessionStorage.removeItem(StorageKeys.flowContext());
    console.log(`🗑️ [FlowStorage] Removed flow context`);
  }

  /**
   * Store restore step (for returning to a flow)
   * @param step - The step number to restore
   */
  static setRestoreStep(step: number): void {
    sessionStorage.setItem(StorageKeys.restoreStep(), step.toString());
    console.log(`📍 [FlowStorage] Set restore step: ${step}`);
  }

  /**
   * Get restore step
   * @returns The step number or null if not found
   */
  static getRestoreStep(): number | null {
    const stored = sessionStorage.getItem(StorageKeys.restoreStep());
    if (!stored) return null;
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Remove restore step
   */
  static removeRestoreStep(): void {
    sessionStorage.removeItem(StorageKeys.restoreStep());
    console.log(`🗑️ [FlowStorage] Removed restore step`);
  }
}

// ============================================
// Cleanup Utilities
// ============================================

/**
 * Storage cleanup utilities
 */
export class StorageCleanup {
  /**
   * Clear all session data for a flow (keeps credentials and tokens)
   * @param flowId - The flow identifier
   */
  static clearFlow(flowId: FlowId): void {
    console.log(`🧹 [FlowStorage] Clearing session data for ${flowId}`);
    
    AuthCodeStorage.remove(flowId);
    DeviceCodeStorage.remove(flowId);
    StateStorage.remove(flowId);
    PKCEStorage.remove(flowId);
    FlowStateStorage.removeCurrentStep(flowId);
    
    console.log(`✅ [FlowStorage] Cleared session data for ${flowId}`);
  }

  /**
   * Clear all data for a flow including credentials
   * @param flowId - The flow identifier
   */
  static clearFlowCompletely(flowId: FlowId): void {
    console.log(`🧹 [FlowStorage] Completely clearing ${flowId}`);
    
    StorageCleanup.clearFlow(flowId);
    CredentialsStorage.remove(flowId);
    
    console.log(`✅ [FlowStorage] Completely cleared ${flowId}`);
  }

  /**
   * Clear all navigation data
   */
  static clearNavigation(): void {
    console.log(`🧹 [FlowStorage] Clearing navigation data`);
    NavigationStorage.removeFlowContext();
    NavigationStorage.removeRestoreStep();
    console.log(`✅ [FlowStorage] Cleared navigation data`);
  }

  /**
   * Clear ALL storage (nuclear option)
   * ⚠️ Use with caution!
   */
  static clearAll(): void {
    console.warn(`☢️ [FlowStorage] CLEARING ALL STORAGE`);
    sessionStorage.clear();
    localStorage.clear();
    console.warn(`☢️ [FlowStorage] ALL STORAGE CLEARED`);
  }
}

// ============================================
// Advanced Parameters Storage
// ============================================

/**
 * Manages advanced OAuth/OIDC parameters storage
 * Used for audience, resources, display, prompt, claims, etc.
 */
export class AdvancedParametersStorage {
  /**
   * Save advanced parameters for a flow
   * @param flowId - The flow identifier
   * @param params - The advanced parameters to save
   */
  static set(flowId: FlowId, params: AdvancedParametersData): void {
    try {
      localStorage.setItem(
        StorageKeys.advancedParameters(flowId), 
        JSON.stringify(params)
      );
      console.log(`💾 [FlowStorage] Saved advanced parameters for ${flowId}:`, params);
    } catch (error) {
      console.error(`❌ [FlowStorage] Failed to save advanced parameters for ${flowId}:`, error);
    }
  }

  /**
   * Get advanced parameters for a flow
   * @param flowId - The flow identifier
   * @returns The advanced parameters or null if not found
   */
  static get(flowId: FlowId): AdvancedParametersData | null {
    try {
      const stored = localStorage.getItem(StorageKeys.advancedParameters(flowId));
      if (!stored) return null;

      const params: AdvancedParametersData = JSON.parse(stored);
      console.log(`📖 [FlowStorage] Loaded advanced parameters for ${flowId}:`, params);
      return params;
    } catch (error) {
      console.error(`❌ [FlowStorage] Failed to load advanced parameters for ${flowId}:`, error);
      return null;
    }
  }

  /**
   * Update specific advanced parameters (partial update)
   * @param flowId - The flow identifier
   * @param updates - Partial parameters to update
   */
  static update(flowId: FlowId, updates: Partial<AdvancedParametersData>): void {
    const existing = AdvancedParametersStorage.get(flowId) || {};
    const merged = { ...existing, ...updates };
    AdvancedParametersStorage.set(flowId, merged);
  }

  /**
   * Clear advanced parameters for a flow
   * @param flowId - The flow identifier
   */
  static clear(flowId: FlowId): void {
    localStorage.removeItem(StorageKeys.advancedParameters(flowId));
    console.log(`🗑️ [FlowStorage] Cleared advanced parameters for ${flowId}`);
  }

  /**
   * Check if advanced parameters exist for a flow
   * @param flowId - The flow identifier
   * @returns True if parameters exist
   */
  static has(flowId: FlowId): boolean {
    return localStorage.getItem(StorageKeys.advancedParameters(flowId)) !== null;
  }
}

// ============================================
// Main Service Export
// ============================================

/**
 * Flow Storage Service
 * Centralized access to all storage operations
 */
export const FlowStorageService = {
  AuthCode: AuthCodeStorage,
  DeviceCode: DeviceCodeStorage,
  State: StateStorage,
  PKCE: PKCEStorage,
  FlowState: FlowStateStorage,
  Credentials: CredentialsStorage,
  Tokens: TokenStorage,
  Navigation: NavigationStorage,
  AdvancedParameters: AdvancedParametersStorage,
  Cleanup: StorageCleanup,
  
  /**
   * Get flow ID from a flow key
   * Maps various flow key formats to standardized flow IDs
   * @param flowKey - The flow key to map
   * @returns The standardized flow ID or null if not found
   */
  getFlowId(flowKey: string): FlowId | null {
    const mapping: Record<string, FlowId> = {
      'oauth-authorization-code-v6': 'oauth-authz-v6',
      'oidc-authorization-code-v6': 'oidc-authz-v6',
      'oauth-authorization-code-v7': 'oauth-authz-v7',
      'oidc-authorization-code-v7': 'oidc-authz-v7',
      'oauth-implicit-v6': 'oauth-implicit-v6',
      'oidc-implicit-v6': 'oidc-implicit-v6',
      'oauth-implicit-v7': 'oauth-implicit-v7',
      'oidc-implicit-v7': 'oidc-implicit-v7',
      'device-authorization-flow-v6': 'oauth-device-auth-v6',
      'oidc-device-authorization-flow-v6': 'oidc-device-auth-v6',
      'device-authorization-flow-v7': 'oauth-device-auth-v7',
      'oidc-device-authorization-flow-v7': 'oidc-device-auth-v7',
      'client-credentials-v6': 'client-credentials-v6',
      'jwt-bearer-token-v6': 'jwt-bearer-v6',
      'saml-bearer-assertion-v6': 'saml-bearer-v6',
      'pingone-par-flow-v6': 'par-v6',
      'rar-flow-v6': 'rar-v6',
      'redirectless-flow-v6': 'redirectless-v6',
      'oauth-hybrid-v6': 'oauth-hybrid-v6',
      'oidc-hybrid-v6': 'oidc-hybrid-v6',
    };
    
    return mapping[flowKey] || null;
  },
};

export default FlowStorageService;

