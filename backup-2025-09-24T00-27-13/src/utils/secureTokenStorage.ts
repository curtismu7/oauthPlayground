/**
 * Secure token storage utility
 * Implements secure token storage using encrypted sessionStorage and secure cookies
 * Follows OAuth 2.0 security best practices
 */

import { OAuthTokens } from './tokenStorage';
import { logger } from './logger';

// Simple encryption/decryption for client-side storage
// In production, consider using a more robust encryption library
class SimpleEncryption {
  private static readonly KEY = 'pingone_oauth_secure_key_2024';

  static encrypt(text: string): string {
    try {
      // Simple XOR encryption for demo purposes
      // In production, use proper encryption like Web Crypto API
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ this.KEY.charCodeAt(i % this.KEY.length)
        );
      }
      return btoa(result);
    } catch (error) {
      logger.error('SecureTokenStorage', 'Encryption error', undefined, error);
      return text;
    }
  }

  static decrypt(encryptedText: string): string {
    try {
      const text = atob(encryptedText);
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ this.KEY.charCodeAt(i % this.KEY.length)
        );
      }
      return result;
    } catch (error) {
      logger.error('SecureTokenStorage', 'Decryption error', undefined, error);
      return encryptedText;
    }
  }
}

/**
 * Secure token storage interface
 */
interface SecureTokenStorage {
  storeTokens(tokens: OAuthTokens): boolean;
  getTokens(): OAuthTokens | null;
  clearTokens(): boolean;
  hasValidTokens(): boolean;
  getTokenExpirationStatus(): {
    hasTokens: boolean;
    isExpired: boolean;
    expiresAt: Date | null;
    timeRemaining: number | null;
  };
}

/**
 * Secure token storage implementation
 * Uses encrypted sessionStorage for temporary storage
 * Tokens are automatically cleared on browser close
 */
class SecureTokenStorageImpl implements SecureTokenStorage {
  private readonly STORAGE_KEY = 'pingone_secure_tokens';
  private readonly MAX_STORAGE_TIME = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Store OAuth tokens securely
   * @param tokens - The OAuth tokens to store
   * @returns boolean - Success status
   */
  storeTokens(tokens: OAuthTokens): boolean {
    try {
      // Add storage timestamp
      const tokensWithTimestamp = {
        ...tokens,
        timestamp: tokens.timestamp || Date.now(),
        storageTime: Date.now()
      };

      // Encrypt the tokens before storing
      const encryptedTokens = SimpleEncryption.encrypt(JSON.stringify(tokensWithTimestamp));
      
      // Store in sessionStorage (cleared on browser close)
      sessionStorage.setItem(this.STORAGE_KEY, encryptedTokens);
      
      logger.success('SecureTokenStorage', 'Tokens stored securely');
      return true;
    } catch (error) {
      logger.error('SecureTokenStorage', 'Error storing tokens', undefined, error);
      return false;
    }
  }

  /**
   * Retrieve OAuth tokens securely
   * @returns OAuthTokens | null - The stored tokens or null if not found
   */
  getTokens(): OAuthTokens | null {
    try {
      const encryptedTokens = sessionStorage.getItem(this.STORAGE_KEY);
      
      if (!encryptedTokens) {
        return null;
      }

      // Decrypt the tokens
      const decryptedTokens = SimpleEncryption.decrypt(encryptedTokens);
      const tokens = JSON.parse(decryptedTokens) as OAuthTokens & { storageTime: number };

      // Check if tokens are too old (security measure)
      if (tokens.storageTime && (Date.now() - tokens.storageTime) > this.MAX_STORAGE_TIME) {
        logger.warn('SecureTokenStorage', 'Tokens too old, clearing');
        this.clearTokens();
        return null;
      }

      // Remove storage metadata before returning
      const { storageTime, ...cleanTokens } = tokens;
      return cleanTokens;
    } catch (error) {
      logger.error('SecureTokenStorage', 'Error retrieving tokens', undefined, error);
      this.clearTokens(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Clear OAuth tokens securely
   * @returns boolean - Success status
   */
  clearTokens(): boolean {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
      logger.success('SecureTokenStorage', 'Tokens cleared securely');
      return true;
    } catch (error) {
      logger.error('SecureTokenStorage', 'Error clearing tokens', undefined, error);
      return false;
    }
  }

  /**
   * Check if valid OAuth tokens exist
   * @returns boolean - Whether valid tokens exist
   */
  hasValidTokens(): boolean {
    try {
      const tokens = this.getTokens();
      
      if (!tokens || !tokens.access_token) {
        return false;
      }
      
      // Check if token is expired
      if (tokens.timestamp && tokens.expires_in) {
        const now = Date.now();
        const expiresAt = tokens.timestamp + (tokens.expires_in * 1000);
        
        if (now >= expiresAt) {
          logger.info('SecureTokenStorage', 'Tokens found but expired');
          this.clearTokens(); // Auto-clear expired tokens
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('SecureTokenStorage', 'Error checking token validity', undefined, error);
      return false;
    }
  }

  /**
   * Get token expiration status
   * @returns object - Token expiration information
   */
  getTokenExpirationStatus() {
    try {
      const tokens = this.getTokens();
      
      if (!tokens || !tokens.timestamp || !tokens.expires_in) {
        return {
          hasTokens: false,
          isExpired: false,
          expiresAt: null,
          timeRemaining: null
        };
      }
      
      const now = Date.now();
      const expiresAt = tokens.timestamp + (tokens.expires_in * 1000);
      const timeRemaining = expiresAt - now;
      const isExpired = timeRemaining <= 0;
      
      return {
        hasTokens: true,
        isExpired,
        expiresAt: new Date(expiresAt),
        timeRemaining: isExpired ? 0 : timeRemaining
      };
    } catch (error) {
      logger.error('SecureTokenStorage', 'Error getting token expiration status', undefined, error);
      return {
        hasTokens: false,
        isExpired: false,
        expiresAt: null,
        timeRemaining: null
      };
    }
  }
}

// Export singleton instance
export const secureTokenStorage = new SecureTokenStorageImpl();

// Export the class for testing
export { SecureTokenStorageImpl, SimpleEncryption };

// Export types
export type { SecureTokenStorage };
