/**
 * Shared token storage utility for OAuth flow pages
 * Ensures all flows store and read tokens from the same location
 */

import { oauthStorage } from './storage';
import { addTokenToHistory } from './tokenHistory';

export interface OAuthTokens {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
  timestamp?: number;
}

/**
 * Store OAuth tokens using the standardized storage method
 * @param tokens - The OAuth tokens to store
 * @param flowType - The OAuth flow type (e.g., 'authorization_code', 'implicit')
 * @param flowName - The display name of the flow
 * @returns boolean - Success status
 */
export const storeOAuthTokens = (tokens: OAuthTokens, flowType?: string, flowName?: string): boolean => {
  try {
    console.log('🔍 [TokenStorage] storeOAuthTokens called with:', { tokens: tokens.access_token ? 'HAS_ACCESS_TOKEN' : 'NO_ACCESS_TOKEN', flowType, flowName });
    
    // Add timestamp if not present
    const tokensWithTimestamp = {
      ...tokens,
      timestamp: tokens.timestamp || Date.now()
    };
    
    // Store using oauthStorage (which handles proper key prefixing)
    const success = oauthStorage.setTokens(tokensWithTimestamp);
    
    if (success) {
      console.log('✅ [TokenStorage] Tokens stored successfully using oauthStorage');
      
      // Add to token history if flow information is provided
      if (flowType && flowName) {
        console.log('📝 [TokenStorage] Adding tokens to history for flow:', flowType, flowName);
        addTokenToHistory(flowType, flowName, tokensWithTimestamp);
      } else {
        console.warn('⚠️ [TokenStorage] No flow information provided, tokens not added to history');
      }
    } else {
      console.error('❌ [TokenStorage] Failed to store tokens using oauthStorage');
    }
    
    return success;
  } catch (error) {
    console.error('❌ [TokenStorage] Error storing tokens:', error);
    return false;
  }
};

/**
 * Retrieve OAuth tokens using the standardized storage method
 * @returns OAuthTokens | null - The stored tokens or null if not found
 */
export const getOAuthTokens = (): OAuthTokens | null => {
  try {
    const tokens = oauthStorage.getTokens();
    
    if (tokens) {
      console.log('✅ [TokenStorage] Tokens retrieved successfully from oauthStorage');
      return tokens;
    } else {
      console.log('ℹ️ [TokenStorage] No tokens found in oauthStorage');
      return null;
    }
  } catch (error) {
    console.error('❌ [TokenStorage] Error retrieving tokens:', error);
    return null;
  }
};

/**
 * Clear OAuth tokens using the standardized storage method
 * @returns boolean - Success status
 */
export const clearOAuthTokens = (): boolean => {
  try {
    const success = oauthStorage.clearTokens();
    
    if (success) {
      console.log('✅ [TokenStorage] Tokens cleared successfully from oauthStorage');
    } else {
      console.error('❌ [TokenStorage] Failed to clear tokens from oauthStorage');
    }
    
    return success;
  } catch (error) {
    console.error('❌ [TokenStorage] Error clearing tokens:', error);
    return false;
  }
};

/**
 * Check if OAuth tokens exist and are valid
 * @returns boolean - Whether valid tokens exist
 */
export const hasValidOAuthTokens = (): boolean => {
  try {
    const tokens = getOAuthTokens();
    
    if (!tokens || !tokens.access_token) {
      return false;
    }
    
    // Check if token is expired (if timestamp and expires_in are available)
    if (tokens.timestamp && tokens.expires_in) {
      const now = Date.now();
      const expiresAt = tokens.timestamp + (tokens.expires_in * 1000);
      
      if (now >= expiresAt) {
        console.log('ℹ️ [TokenStorage] Tokens found but expired');
        return false;
      }
    }
    
    console.log('✅ [TokenStorage] Valid tokens found');
    return true;
  } catch (error) {
    console.error('❌ [TokenStorage] Error checking token validity:', error);
    return false;
  }
};

/**
 * Get token expiration status
 * @returns object - Token expiration information
 */
export const getTokenExpirationStatus = () => {
  try {
    const tokens = getOAuthTokens();
    
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
    console.error('❌ [TokenStorage] Error getting token expiration status:', error);
    return {
      hasTokens: false,
      isExpired: false,
      expiresAt: null,
      timeRemaining: null
    };
  }
};
