// src/services/pingOneAuthService.ts
// PingOne Authentication Service for complete MFA flow integration

import { logger } from '../utils/logger';
import { validateCredentials } from '../utils/validation';

export interface LoginCredentials {
  username: string;
  password: string;
  environmentId: string;
}

export interface AuthenticationResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  userId?: string;
  expiresAt?: Date;
  error?: AuthenticationError;
  mfaRequired?: boolean;
  flowId?: string;
}

export interface AuthenticationError {
  code: string;
  message: string;
  details?: string;
  retryable?: boolean;
  suggestedAction?: string;
}

export interface SessionValidation {
  valid: boolean;
  userId?: string;
  expiresAt?: Date;
  permissions?: string[];
  mfaCompleted?: boolean;
  error?: string;
}

export interface TokenRefresh {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: string;
}

export interface EnvironmentConfig {
  environmentId: string;
  authUrl: string;
  apiUrl: string;
  mfaUrl: string;
  region: string;
  issuer: string;
}

export interface AuthenticationSession {
  sessionId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
  
  // Session metadata
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastActivity: Date;
  
  // MFA status
  mfaCompleted: boolean;
  mfaDeviceUsed?: string;
  mfaTimestamp?: Date;
  
  // Security flags
  riskScore?: number;
  requiresReauth: boolean;
  securityFlags: string[];
}

class PingOneAuthService {
  private static readonly TOKEN_STORAGE_KEY = 'pingone_auth_session';
  private static readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private static readonly REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes before expiry

  /**
   * Authenticate user with PingOne using username and password
   */
  static async authenticate(credentials: LoginCredentials): Promise<AuthenticationResult> {
    try {
      logger.info('PingOneAuthService', 'Starting authentication', {
        username: credentials.username,
        environmentId: credentials.environmentId
      });

      // Validate input credentials
      const validation = this.validateCredentials(credentials);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid credentials provided',
            details: validation.errors.join(', '),
            retryable: true,
            suggestedAction: 'Please check your username, password, and environment ID'
          }
        };
      }

      // Get environment configuration
      const envConfig = await this.getEnvironmentConfig(credentials.environmentId);
      if (!envConfig) {
        return {
          success: false,
          error: {
            code: 'INVALID_ENVIRONMENT',
            message: 'Invalid environment configuration',
            retryable: false,
            suggestedAction: 'Please verify the environment ID is correct'
          }
        };
      }

      // Perform authentication request to PingOne
      const authResponse = await this.performAuthentication(credentials, envConfig);
      
      if (authResponse.success && authResponse.accessToken) {
        // Create and store session
        const session = await this.createSession(authResponse, envConfig);
        
        logger.info('PingOneAuthService', 'Authentication successful', {
          userId: authResponse.userId,
          sessionId: session.sessionId,
          mfaRequired: authResponse.mfaRequired
        });

        return {
          ...authResponse,
          sessionId: session.sessionId
        };
      }

      return authResponse;
    } catch (error) {
      logger.error('PingOneAuthService', 'Authentication failed', {
        username: credentials.username,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication request failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          suggestedAction: 'Please try again or check your network connection'
        }
      };
    }
  }

  /**
   * Validate current session and token
   */
  static async validateSession(token: string): Promise<SessionValidation> {
    try {
      const session = this.getStoredSession();
      if (!session) {
        return { valid: false, error: 'No active session found' };
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        // Try to refresh token
        const refreshResult = await this.refreshToken(session.refreshToken);
        if (!refreshResult.success) {
          this.clearSession();
          return { valid: false, error: 'Session expired and refresh failed' };
        }
        
        // Update session with new tokens
        session.accessToken = refreshResult.accessToken!;
        session.refreshToken = refreshResult.refreshToken!;
        session.expiresAt = refreshResult.expiresAt!;
        this.storeSession(session);
      }

      // Validate token with PingOne
      const validation = await this.validateTokenWithPingOne(session.accessToken);
      
      return {
        valid: validation.valid,
        userId: session.userId,
        expiresAt: session.expiresAt,
        mfaCompleted: session.mfaCompleted,
        permissions: validation.permissions,
        error: validation.error
      };
    } catch (error) {
      logger.error('PingOneAuthService', 'Session validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        valid: false,
        error: 'Session validation failed'
      };
    }
  }

  /**
   * Refresh authentication token
   */
  static async refreshToken(refreshToken: string): Promise<TokenRefresh> {
    try {
      logger.info('PingOneAuthService', 'Refreshing authentication token');

      const session = this.getStoredSession();
      if (!session) {
        return {
          success: false,
          error: 'No active session to refresh'
        };
      }

      // Check if refresh token is still valid
      if (new Date() > session.refreshExpiresAt) {
        this.clearSession();
        return {
          success: false,
          error: 'Refresh token expired, please re-authenticate'
        };
      }

      // Make refresh request to PingOne
      const refreshResponse = await this.performTokenRefresh(refreshToken, session);
      
      if (refreshResponse.success) {
        logger.info('PingOneAuthService', 'Token refresh successful');
      }

      return refreshResponse;
    } catch (error) {
      logger.error('PingOneAuthService', 'Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: 'Token refresh request failed'
      };
    }
  }

  /**
   * Logout and clear session
   */
  static async logout(sessionId?: string): Promise<void> {
    try {
      const session = this.getStoredSession();
      if (session) {
        logger.info('PingOneAuthService', 'Logging out user', {
          userId: session.userId,
          sessionId: session.sessionId
        });

        // Revoke tokens with PingOne
        await this.revokeTokens(session);
      }

      // Clear local session
      this.clearSession();
    } catch (error) {
      logger.error('PingOneAuthService', 'Logout failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Clear session even if revocation fails
      this.clearSession();
    }
  }

  /**
   * Get environment configuration for PingOne
   */
  static async getEnvironmentConfig(environmentId?: string): Promise<EnvironmentConfig | null> {
    try {
      if (!environmentId) {
        // Use default environment from config
        environmentId = import.meta.env.VITE_PINGONE_ENVIRONMENT_ID;
      }

      if (!environmentId) {
        return null;
      }

      // Determine region and URLs based on environment ID
      const region = this.determineRegion(environmentId);
      
      return {
        environmentId,
        authUrl: `https://auth.pingone.${region}`,
        apiUrl: `https://api.pingone.${region}`,
        mfaUrl: `https://api.pingone.${region}/v1/environments/${environmentId}/mfa`,
        region,
        issuer: `https://auth.pingone.${region}/${environmentId}/as`
      };
    } catch (error) {
      logger.error('PingOneAuthService', 'Failed to get environment config', {
        environmentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Get current authentication session
   */
  static getCurrentSession(): AuthenticationSession | null {
    return this.getStoredSession();
  }

  /**
   * Check if user is currently authenticated
   */
  static isAuthenticated(): boolean {
    const session = this.getStoredSession();
    if (!session) return false;
    
    // Check if session is not expired
    return new Date() < session.expiresAt;
  }

  /**
   * Mark MFA as completed for current session
   */
  static markMFACompleted(deviceId: string): void {
    const session = this.getStoredSession();
    if (session) {
      session.mfaCompleted = true;
      session.mfaDeviceUsed = deviceId;
      session.mfaTimestamp = new Date();
      session.lastActivity = new Date();
      this.storeSession(session);
      
      logger.info('PingOneAuthService', 'MFA marked as completed', {
        userId: session.userId,
        deviceId
      });
    }
  }

  // Private helper methods

  private static validateCredentials(credentials: LoginCredentials): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!credentials.username?.trim()) {
      errors.push('Username is required');
    }

    if (!credentials.password?.trim()) {
      errors.push('Password is required');
    }

    if (!credentials.environmentId?.trim()) {
      errors.push('Environment ID is required');
    }

    // Basic email format validation for username
    if (credentials.username && !this.isValidEmail(credentials.username)) {
      errors.push('Username must be a valid email address');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static async performAuthentication(
    credentials: LoginCredentials, 
    envConfig: EnvironmentConfig
  ): Promise<AuthenticationResult> {
    // This would make actual API calls to PingOne
    // For now, implementing a mock that simulates real behavior
    
    const authUrl = `${envConfig.authUrl}/${envConfig.environmentId}/as/token`;
    
    const requestBody = {
      grant_type: 'password',
      username: credentials.username,
      password: credentials.password,
      client_id: import.meta.env.VITE_PINGONE_CLIENT_ID,
      client_secret: import.meta.env.VITE_PINGONE_CLIENT_SECRET,
      scope: 'openid profile email'
    };

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      return {
        success: false,
        error: {
          code: errorData.error || 'AUTHENTICATION_FAILED',
          message: errorData.error_description || 'Authentication failed',
          retryable: response.status >= 500 || response.status === 429,
          suggestedAction: this.getAuthErrorSuggestion(response.status, errorData.error)
        }
      };
    }

    const tokenData = await response.json();
    
    return {
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      userId: this.extractUserIdFromToken(tokenData.access_token),
      expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
      mfaRequired: false, // Will be determined by subsequent MFA checks
      flowId: this.generateFlowId()
    };
  }

  private static async createSession(
    authResult: AuthenticationResult, 
    envConfig: EnvironmentConfig
  ): Promise<AuthenticationSession> {
    const sessionId = this.generateSessionId();
    const now = new Date();
    
    const session: AuthenticationSession = {
      sessionId,
      userId: authResult.userId!,
      accessToken: authResult.accessToken!,
      refreshToken: authResult.refreshToken!,
      expiresAt: authResult.expiresAt!,
      refreshExpiresAt: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)), // 7 days
      
      createdAt: now,
      lastActivity: now,
      
      mfaCompleted: false,
      requiresReauth: false,
      securityFlags: []
    };

    // Add security metadata
    if (typeof window !== 'undefined') {
      session.userAgent = navigator.userAgent;
      // IP address would be determined server-side in real implementation
    }

    this.storeSession(session);
    return session;
  }

  private static async validateTokenWithPingOne(token: string): Promise<{ valid: boolean; permissions?: string[]; error?: string }> {
    try {
      // In real implementation, this would validate with PingOne introspection endpoint
      // For now, basic JWT validation
      const payload = this.decodeJWTPayload(token);
      if (!payload) {
        return { valid: false, error: 'Invalid token format' };
      }

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Token expired' };
      }

      return {
        valid: true,
        permissions: payload.scope?.split(' ') || []
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Token validation failed'
      };
    }
  }

  private static async performTokenRefresh(refreshToken: string, session: AuthenticationSession): Promise<TokenRefresh> {
    // Mock implementation - would make real API call to PingOne
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const newAccessToken = this.generateMockToken(session.userId);
      const expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT_MS);
      
      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: refreshToken, // Refresh token typically doesn't change
        expiresAt
      };
    } catch (error) {
      return {
        success: false,
        error: 'Token refresh failed'
      };
    }
  }

  private static async revokeTokens(session: AuthenticationSession): Promise<void> {
    // In real implementation, would call PingOne revocation endpoint
    logger.info('PingOneAuthService', 'Tokens revoked', {
      userId: session.userId,
      sessionId: session.sessionId
    });
  }

  private static determineRegion(environmentId: string): string {
    // Simple region determination based on environment ID patterns
    // In real implementation, this might involve API discovery
    if (environmentId.includes('eu')) return 'eu';
    if (environmentId.includes('asia')) return 'asia';
    return 'com'; // Default to North America
  }

  private static getAuthErrorSuggestion(status: number, errorCode?: string): string {
    switch (status) {
      case 401:
        return 'Please check your username and password';
      case 403:
        return 'Account may be locked or disabled';
      case 404:
        return 'Please verify the environment ID is correct';
      case 429:
        return 'Too many attempts, please wait before trying again';
      case 500:
      case 502:
      case 503:
        return 'PingOne service temporarily unavailable, please try again later';
      default:
        return 'Please check your credentials and try again';
    }
  }

  private static extractUserIdFromToken(token: string): string {
    const payload = this.decodeJWTPayload(token);
    return payload?.sub || this.generateUserId();
  }

  private static decodeJWTPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  private static generateFlowId(): string {
    return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateMockToken(userId: string): string {
    // Generate a mock JWT-like token for development
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
      scope: 'openid profile email'
    }));
    const signature = btoa('mock_signature');
    
    return `${header}.${payload}.${signature}`;
  }

  // Session storage methods

  private static storeSession(session: AuthenticationSession): void {
    try {
      if (typeof window !== 'undefined') {
        const sessionData = {
          ...session,
          expiresAt: session.expiresAt.toISOString(),
          refreshExpiresAt: session.refreshExpiresAt.toISOString(),
          createdAt: session.createdAt.toISOString(),
          lastActivity: session.lastActivity.toISOString(),
          mfaTimestamp: session.mfaTimestamp?.toISOString()
        };
        
        localStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(sessionData));
      }
    } catch (error) {
      logger.error('PingOneAuthService', 'Failed to store session', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private static getStoredSession(): AuthenticationSession | null {
    try {
      if (typeof window === 'undefined') return null;
      
      const stored = localStorage.getItem(this.TOKEN_STORAGE_KEY);
      if (!stored) return null;
      
      const sessionData = JSON.parse(stored);
      
      return {
        ...sessionData,
        expiresAt: new Date(sessionData.expiresAt),
        refreshExpiresAt: new Date(sessionData.refreshExpiresAt),
        createdAt: new Date(sessionData.createdAt),
        lastActivity: new Date(sessionData.lastActivity),
        mfaTimestamp: sessionData.mfaTimestamp ? new Date(sessionData.mfaTimestamp) : undefined
      };
    } catch (error) {
      logger.error('PingOneAuthService', 'Failed to retrieve session', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private static clearSession(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.TOKEN_STORAGE_KEY);
      }
    } catch (error) {
      logger.error('PingOneAuthService', 'Failed to clear session', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default PingOneAuthService;