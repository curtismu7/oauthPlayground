import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { oauthStorage } from '../utils/storage';
import type { OAuthTokens, UserInfo, OAuthTokenResponse } from '../types/storage';
import { AuthContextType, AuthState, LoginResult } from '../types/auth';

// Define the complete config type with all required properties
interface AppConfig {
  disableLogin: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  endSessionEndpoint: string;
  scopes: string[];
  environmentId: string;
  [key: string]: any; // Allow additional properties
}

// Create the auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions
const isTokenValid = (tokens: OAuthTokens | null): boolean => {
  if (!tokens?.access_token) return false;
  const now = Date.now();
  const expiresAt = tokens.expires_at || 0;
  return expiresAt ? now < expiresAt : false;
};

const isRefreshTokenValid = (tokens: OAuthTokens | null): boolean => {
  if (!tokens?.refresh_token) return false;
  const now = Date.now();
  const refreshExpiresAt = tokens.refresh_expires_at || 0;
  return refreshExpiresAt ? now < refreshExpiresAt : false;
};

const getStoredTokens = (): OAuthTokens | null => {
  try {
    const tokens = oauthStorage.getTokens();
    console.log('🔍 [getStoredTokens] Retrieved tokens from oauthStorage:', tokens);
    return tokens ? JSON.parse(JSON.stringify(tokens)) : null;
  } catch (error) {
    console.error('Error parsing stored tokens:', error);
    return null;
  }
};

const getStoredUser = (): UserInfo | null => {
  try {
    const user = oauthStorage.getUserInfo();
    return user ? JSON.parse(JSON.stringify(user)) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    tokens: null,
    isLoading: true,
    error: null,
  });

  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRequestData, setAuthRequestData] = useState<{
    authorizationUrl: string;
    requestParams: Record<string, string>;
  } | null>(null);

  // Configuration state that updates when localStorage changes
  const [config, setConfig] = useState<AppConfig>(() => {
    // Initialize config on first render
    return loadConfiguration();
  });

  // Load tokens from storage on component mount and listen for changes
  useEffect(() => {
    const loadTokensFromStorage = () => {
      try {
        const storedTokens = getStoredTokens();
        console.log('🔍 [NewAuthContext] Checking for tokens in storage:', storedTokens);
        if (storedTokens && storedTokens.access_token) {
          console.log('✅ [NewAuthContext] Loading tokens from storage:', storedTokens);
          setState(prev => ({
            ...prev,
            tokens: storedTokens,
            isAuthenticated: true,
            isLoading: false
          }));
        } else {
          console.log('ℹ️ [NewAuthContext] No valid tokens found in storage');
          setState(prev => ({
            ...prev,
            isLoading: false
          }));
        }
      } catch (error) {
        console.error('❌ [NewAuthContext] Error loading tokens from storage:', error);
        setState(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    };

    loadTokensFromStorage();

    // Listen for storage changes to detect new tokens
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'oauthStorage' || e.key?.includes('oauth')) {
        console.log('🔍 [NewAuthContext] Storage change detected:', e.key, e.newValue);
        loadTokensFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Function to load configuration from environment variables or localStorage
  function loadConfiguration(): AppConfig {
    const envId = (window as any).__PINGONE_ENVIRONMENT_ID__;
    const apiUrl = (window as any).__PINGONE_API_URL__;
    const clientId = (window as any).__PINGONE_CLIENT_ID__;

    // Debug logging
    console.log('🔍 [NewAuthContext] Loading configuration...', {
      envId,
      apiUrl,
      clientId,
      redirectUri: (window as any).__PINGONE_REDIRECT_URI__
    });

    // Check if we have the required configuration from environment variables
    if (envId && apiUrl && clientId) {
      console.log('✅ [NewAuthContext] Using environment variables for configuration');
      
      const envConfig = {
        disableLogin: false,
        clientId: clientId || '',
        clientSecret: (window as any).__PINGONE_CLIENT_SECRET__ || '',
        redirectUri: (window as any).__PINGONE_REDIRECT_URI__ || `${window.location.origin}/callback`,
        authorizationEndpoint: `${apiUrl}/${envId}/as/authorize`,
        tokenEndpoint: `${apiUrl}/${envId}/as/token`,
        userInfoEndpoint: `${apiUrl}/${envId}/as/userinfo`,
        endSessionEndpoint: `${apiUrl}/${envId}/as/endsession`,
        scopes: ['openid', 'profile', 'email'],
        environmentId: envId || ''
      };
      
      // Store config in localStorage for fallback
      try {
        localStorage.setItem('pingone_config', JSON.stringify(envConfig));
        console.log('💾 [NewAuthContext] Environment config stored in localStorage');
      } catch (error) {
        console.warn('⚠️ [NewAuthContext] Failed to store env config in localStorage:', error);
      }
      
      return envConfig;
    }

    // Fallback to localStorage
    console.log('⚠️ [NewAuthContext] Environment variables missing, checking localStorage...');
    
    const storedConfig = localStorage.getItem('pingone_config');
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        console.log('🔍 [NewAuthContext] Found stored config:', parsed);
        
        // Validate that we have the minimum required fields
        if (parsed.clientId && parsed.environmentId) {
          // Map the stored config fields to the expected AppConfig structure
          const mappedConfig = {
            disableLogin: false,
            clientId: parsed.clientId || '',
            clientSecret: parsed.clientSecret || '',
            redirectUri: parsed.redirectUri || `${window.location.origin}/callback`,
            authorizationEndpoint: parsed.authEndpoint || parsed.authorizationEndpoint || '',
            tokenEndpoint: parsed.tokenEndpoint || '',
            userInfoEndpoint: parsed.userInfoEndpoint || '',
            endSessionEndpoint: parsed.endSessionEndpoint || '',
            scopes: parsed.scopes || ['openid', 'profile', 'email'],
            environmentId: parsed.environmentId || ''
          };
          
          console.log('✅ [NewAuthContext] Using stored config from localStorage:', mappedConfig);
          return mappedConfig;
        } else {
          console.warn('⚠️ [NewAuthContext] Stored config missing required fields:', parsed);
        }
      } catch (error) {
        console.error('❌ [NewAuthContext] Failed to parse stored config:', error);
      }
    }
    
    console.error('❌ [NewAuthContext] No valid configuration available');
    return {
      disableLogin: false,
      clientId: '',
      clientSecret: '',
      redirectUri: `${window.location.origin}/callback`,
      authorizationEndpoint: '',
      tokenEndpoint: '',
      userInfoEndpoint: '',
      endSessionEndpoint: '',
      scopes: ['openid', 'profile', 'email'],
      environmentId: ''
    };
  }

  // Function to refresh configuration
  const refreshConfig = useCallback(() => {
    console.log('🔄 [NewAuthContext] Refreshing configuration...');
    const newConfig = loadConfiguration();
    setConfig(newConfig);
  }, []);

  // Listen for localStorage changes and force config refresh
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pingone_config') {
        console.log('🔄 [NewAuthContext] localStorage pingone_config changed, refreshing config...');
        refreshConfig();
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (for same-tab updates)
    const handleCustomStorageChange = () => {
      console.log('🔄 [NewAuthContext] Custom storage event received, refreshing config...');
      refreshConfig();
    };

    window.addEventListener('pingone-config-changed', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pingone-config-changed', handleCustomStorageChange);
    };
  }, [refreshConfig]);

  // Update state helper
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      error: updates.error !== undefined ? updates.error : null, // Clear error if not provided
    }));
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const [storedTokens, storedUser] = await Promise.all([
          getStoredTokens(),
          getStoredUser(),
        ]);

        if (storedTokens && isTokenValid(storedTokens)) {
          updateState({
            isAuthenticated: true,
            user: storedUser,
            tokens: storedTokens,
            isLoading: false,
          });
        } else if (storedTokens?.refresh_token && isRefreshTokenValid(storedTokens)) {
          // Handle token refresh here
          console.log('Token expired but refresh token is valid');
          updateState({ isLoading: false });
        } else {
          // Clear invalid tokens
          oauthStorage.clearAll();
          updateState({ isLoading: false });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        updateState({
          error: 'Failed to initialize authentication',
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, [updateState]);

  // Login function
  const login = useCallback(async (redirectAfterLogin = '/'): Promise<LoginResult> => {
    try {
      updateState({ isLoading: true, error: null });

      // Handle disabled login mode for testing
      if (config.disableLogin) {
        const mockUser = {
          sub: 'mock-user-123',
          email: 'test@example.com',
          name: 'Test User',
        };

        const mockTokens = {
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          expires_at: Date.now() + 3600 * 1000,
          refresh_expires_at: Date.now() + 5 * 24 * 3600 * 1000, // 5 days
        };

        oauthStorage.setUserInfo(mockUser);
        oauthStorage.setTokens(mockTokens);

        updateState({
          isAuthenticated: true,
          user: mockUser,
          tokens: mockTokens,
          isLoading: false,
        });

        return { success: true, redirectUrl: redirectAfterLogin };
      }

      // Handle regular OAuth flow
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(32);
      const nonce = generateRandomString(32);

      // Store PKCE verifier and state for later verification
      oauthStorage.setCodeVerifier(codeVerifier);
      oauthStorage.setState(state);
      oauthStorage.setNonce(nonce);

      // Build authorization URL
      const authUrl = new URL(config.authorizationEndpoint);
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: 'openid profile email',
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      authUrl.search = params.toString();
      window.location.href = authUrl.toString();

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      updateState({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  }, [config, updateState]);

  // Logout function
  const logout = useCallback(() => {
    try {
      // Clear all auth-related data
      oauthStorage.clearAll();
      
      // Reset state
      updateState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        error: null,
      });

      // Redirect to home or login page
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      updateState({ error: 'Failed to log out. Please try again.' });
    }
  }, [updateState]);

  // Handle OAuth callback
  const handleCallback = useCallback(async (url: string): Promise<LoginResult> => {
    console.log('🚀 [NewAuthContext] handleCallback called with URL:', url);
    try {
      updateState({ isLoading: true, error: null });

      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');
      
      console.log('🔍 [NewAuthContext] Parsed callback parameters:', { code, state, error });

      if (error) {
        throw new Error(`OAuth error: ${error}. ${params.get('error_description') || ''}`);
      }

      if (!code || !state) {
        throw new Error('Missing required parameters in callback URL');
      }

      // Verify state matches what we stored
      const storedState = oauthStorage.getState();
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for tokens
      console.log('🔍 [NewAuthContext] Getting code verifier...');
      const codeVerifier = oauthStorage.getCodeVerifier();
      console.log('🔍 [NewAuthContext] Code verifier:', codeVerifier ? 'FOUND' : 'NOT_FOUND');
      if (!codeVerifier) {
        throw new Error('Missing code verifier');
      }

      console.log('🔍 [NewAuthContext] About to call exchangeCodeForTokens...');
      const tokenResponse = await exchangeCodeForTokens(
        config.tokenEndpoint,
        {
          grant_type: 'authorization_code',
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          code,
          code_verifier: codeVerifier,
        }
      );
      console.log('✅ [NewAuthContext] exchangeCodeForTokens completed successfully');

      // Store tokens first
      console.log('🔍 [NewAuthContext] Storing token response:', tokenResponse);
      const storageSuccess = oauthStorage.setTokens(tokenResponse);
      console.log('🔍 [NewAuthContext] Token storage success:', storageSuccess);
      
      // Debug: Check if tokens were actually stored
      const storedTokens = oauthStorage.getTokens();
      console.log('🔍 [NewAuthContext] Verification - tokens retrieved from storage:', storedTokens);
      
      // Debug: Check sessionStorage directly
      const rawStoredTokens = sessionStorage.getItem('pingone_playground_tokens');
      console.log('🔍 [NewAuthContext] Raw tokens in sessionStorage:', rawStoredTokens);
      
      // Only get user info if this is an OIDC flow (has id_token or openid scope)
      let userInfo = null;
      if (tokenResponse.id_token || (tokenResponse.scope && tokenResponse.scope.includes('openid'))) {
        console.log('🔍 [NewAuthContext] OIDC flow detected, fetching user info');
        try {
          userInfo = await getUserInfo(config.userInfoEndpoint, tokenResponse.access_token);
          oauthStorage.setUserInfo(userInfo);
        } catch (error) {
          console.warn('⚠️ [NewAuthContext] Failed to fetch user info:', error);
        }
      } else {
        console.log('🔍 [NewAuthContext] OAuth 2.0 flow detected, skipping user info fetch');
      }

      // Update state
      console.log('🔍 [NewAuthContext] Updating state with tokens:', tokenResponse);
      updateState({
        isAuthenticated: true,
        user: userInfo,
        tokens: tokenResponse,
        isLoading: false,
      });
      console.log('✅ [NewAuthContext] State updated successfully');

      // Track token source for Token Management page
      // tokenSourceTracker.storeTokenSource({
      //   source: 'login',
      //   description: 'OAuth Login Flow - Authorization Code Grant',
      //   tokens: {
      //     access_token: tokenResponse.access_token,
      //     id_token: tokenResponse.id_token || undefined,
      //     refresh_token: tokenResponse.refresh_token || undefined,
      //     token_type: tokenResponse.token_type,
      //     expires_in: tokenResponse.expires_in || undefined,
      //     scope: tokenResponse.scope || undefined
      //   }
      // });

      // Get redirect URL from session storage or use default
      const redirectUrl = sessionStorage.getItem('redirect_after_login') || '/';
      sessionStorage.removeItem('redirect_after_login');

      return { success: true, redirectUrl };
    } catch (error) {
      console.error('❌ [NewAuthContext] Error in handleCallback:', error);
      console.error('❌ [NewAuthContext] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      updateState({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  }, [config, updateState]);

  // Set auth state
  const setAuthState = useCallback((updates: Partial<AuthState>) => {
    updateState(updates);
  }, [updateState]);

  // Function to proceed with OAuth redirect after modal confirmation
  const proceedWithOAuth = useCallback(() => {
    if (authRequestData) {
      console.log('🔍 [NewAuthContext] Proceeding with OAuth redirect');
      window.location.href = authRequestData.authorizationUrl;
    }
  }, [authRequestData]);

  // Close modal function
  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
    setAuthRequestData(null);
  }, []);

  // Function to update tokens (useful for external token updates)
  const updateTokens = useCallback((newTokens: OAuthTokens | null) => {
    console.log('🔄 [NewAuthContext] Updating tokens:', newTokens);
    setState(prev => ({
      ...prev,
      tokens: newTokens,
      isAuthenticated: !!newTokens?.access_token,
      isLoading: false
    }));
  }, []);

  // Context value
  const contextValue = useMemo(() => ({
    ...state,
    config, // Add the config to the context
    login,
    logout,
    handleCallback,
    setAuthState,
    showAuthModal,
    authRequestData,
    proceedWithOAuth,
    closeAuthModal,
    updateTokens, // Add the updateTokens function
  }), [state, config, login, logout, handleCallback, setAuthState, showAuthModal, authRequestData, proceedWithOAuth, closeAuthModal, updateTokens]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper functions for PKCE flow
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function exchangeCodeForTokens(
  tokenEndpoint: string,
  params: Record<string, string>
): Promise<OAuthTokens> {
  console.log('🚀 [exchangeCodeForTokens] Starting token exchange...');
  console.log('🔍 [exchangeCodeForTokens] Token endpoint:', tokenEndpoint);
  console.log('🔍 [exchangeCodeForTokens] Request params:', params);
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });

  console.log('🔍 [exchangeCodeForTokens] Response status:', response.status);
  console.log('🔍 [exchangeCodeForTokens] Response ok:', response.ok);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('❌ [exchangeCodeForTokens] Token exchange failed:', error);
    throw new Error(error.error_description || 'Failed to exchange code for tokens');
  }

  const data: OAuthTokenResponse = await response.json();
  console.log('✅ [exchangeCodeForTokens] Token exchange successful:', data);
  
  // Add expiration timestamps
  const now = Date.now();
  const tokens: Omit<OAuthTokens, keyof OAuthTokenResponse> & OAuthTokenResponse = {
    ...data,
    expires_at: data.expires_in ? now + data.expires_in * 1000 : undefined,
    refresh_expires_at: data.refresh_token ? now + 5 * 24 * 60 * 60 * 1000 : undefined, // 5 days
  };

  console.log('✅ [exchangeCodeForTokens] Final tokens with timestamps:', tokens);
  return tokens;
}

async function getUserInfo(userInfoEndpoint: string, accessToken: string): Promise<UserInfo> {
  const response = await fetch(userInfoEndpoint, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  return response.json();
}
