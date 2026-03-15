/**
 * Token utility functions for OAuth token debugging
 * Provides JWT token decoding and OAuth token fetching functionality
 */

import apiClient from './apiClient';

/**
 * Decodes a JWT token into its component parts
 * @param {string} token - The JWT token to decode
 * @returns {Object} Object containing header, payload, and raw token
 * @throws {Error} If token is malformed or decoding fails
 */
export const decodeJWTToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string');
  }

  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token format - must have 3 parts separated by dots');
  }

  try {
    // Decode header (first part)
    let header = null;
    try {
      const headerDecoded = atob(parts[0]);
      header = JSON.parse(headerDecoded);
    } catch (error) {
      console.warn('Failed to decode JWT header:', error.message);
      header = { error: 'Failed to decode header' };
    }

    // Decode payload (second part)
    let payload = null;
    try {
      // Add padding if needed for base64 decoding
      let paddedPayload = parts[1];
      while (paddedPayload.length % 4) {
        paddedPayload += '=';
      }
      const payloadDecoded = atob(paddedPayload);
      payload = JSON.parse(payloadDecoded);
    } catch (error) {
      console.warn('Failed to decode JWT payload:', error.message);
      payload = { error: 'Failed to decode payload' };
    }

    return {
      header,
      payload,
      signature: parts[2], // Keep signature as-is (can't decode without key)
      raw: token
    };
  } catch (error) {
    throw new Error(`Failed to decode JWT token: ${error.message}`);
  }
};

/**
 * Fetches current OAuth token data from the server
 * @returns {Promise<Object>} Promise resolving to token data with decoded information
 * @throws {Error} If token fetch fails or no token is available
 */
export const fetchOAuthTokenData = async () => {
  try {
    console.log('🔍 [TokenUtils] Fetching OAuth token data...');
    
    // Use the existing getSessionStatus method from apiClient
    const sessionData = await apiClient.getSessionStatus();
    
    if (!sessionData || !sessionData.authenticated) {
      throw new Error('No authenticated OAuth session found');
    }

    if (!sessionData.accessToken) {
      throw new Error('No access token available in session');
    }

    console.log('✅ [TokenUtils] OAuth session data retrieved');

    // Decode the access token if it's a JWT
    let decodedToken = null;
    try {
      decodedToken = decodeJWTToken(sessionData.accessToken);
      console.log('✅ [TokenUtils] JWT token decoded successfully');
    } catch (decodeError) {
      console.warn('⚠️ [TokenUtils] Token is not a valid JWT or decoding failed:', decodeError.message);
      // For non-JWT tokens (like opaque OAuth tokens), we'll still return the raw token
      decodedToken = {
        header: null,
        payload: null,
        signature: null,
        raw: sessionData.accessToken,
        error: 'Token is not a JWT or decoding failed'
      };
    }

    // Format the response with all available information
    const tokenData = {
      accessToken: decodedToken,
      tokenType: sessionData.tokenType || 'Bearer',
      expiresAt: sessionData.expiresAt,
      clientType: sessionData.clientType,
      oauthProvider: sessionData.oauthProvider || 'lending-oauth',
      user: sessionData.user || {},
      sessionInfo: {
        authenticated: sessionData.authenticated,
        scopes: sessionData.scopes || [],
        issuedAt: sessionData.issuedAt,
        lastActivity: sessionData.lastActivity
      }
    };

    console.log('✅ [TokenUtils] Token data formatted successfully');
    return tokenData;

  } catch (error) {
    console.error('❌ [TokenUtils] Failed to fetch OAuth token data:', error);
    
    // Re-throw with more specific error information
    if (error.response?.status === 401) {
      throw new Error('Authentication required - please log in again');
    } else if (error.response?.status === 403) {
      throw new Error('Insufficient permissions to access token information');
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network error - please check your connection');
    } else {
      throw new Error(`Failed to fetch token data: ${error.message}`);
    }
  }
};

/**
 * Validates if a string looks like a JWT token
 * @param {string} token - The token to validate
 * @returns {boolean} True if token appears to be a JWT
 */
export const isJWTToken = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

/**
 * Formats token expiration time for display
 * @param {string|number} expiresAt - Expiration timestamp (ISO string or Unix timestamp)
 * @returns {Object} Formatted expiration information
 */
export const formatTokenExpiration = (expiresAt) => {
  if (!expiresAt) {
    return {
      formatted: 'Unknown',
      isExpired: false,
      timeUntilExpiry: null
    };
  }

  try {
    const expirationDate = new Date(expiresAt);
    
    // Check if the date is invalid
    if (isNaN(expirationDate.getTime())) {
      return {
        formatted: 'Invalid Date',
        isExpired: false,
        timeUntilExpiry: null
      };
    }
    
    const now = new Date();
    const isExpired = expirationDate <= now;
    const timeUntilExpiry = isExpired ? 0 : expirationDate.getTime() - now.getTime();

    return {
      formatted: expirationDate.toLocaleString(),
      isExpired,
      timeUntilExpiry,
      expirationDate
    };
  } catch (error) {
    console.warn('Failed to parse expiration date:', error);
    return {
      formatted: 'Invalid date',
      isExpired: false,
      timeUntilExpiry: null
    };
  }
};

/**
 * Safely formats JSON data for display
 * @param {any} data - Data to format as JSON
 * @param {number} indent - Number of spaces for indentation
 * @returns {string} Formatted JSON string
 */
export const formatJSONForDisplay = (data, indent = 2) => {
  try {
    if (data === null || data === undefined) {
      return 'null';
    }
    return JSON.stringify(data, null, indent);
  } catch (error) {
    console.warn('Failed to format JSON:', error);
    return String(data);
  }
};