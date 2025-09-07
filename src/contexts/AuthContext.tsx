import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { oauthStorage, sessionStorageService } from '../utils/storage';
import { clientLog } from '../utils/clientLogger';
import { config } from '../services/config';
import type { OAuthTokens as StorageOAuthTokens, UserInfo, OAuthTokenResponse } from '../types/storage';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthContextType, AuthState, LoginResult, User } from '../types/auth';

// Define type for development window helpers
interface WindowWithDevHelpers extends Window {
  __refreshAccessToken?: () => Promise<void>;
}

// Re-export types for backward compatibility
export type OAuthTokens = StorageOAuthTokens;

// Mock user for testing when login is disabled
const mockUser: User = {
  sub: 'mock-user-123',
  id: 'mock-user-123',
  email: 'test@example.com',
  name: 'Test User',
  given_name: 'Test',
  family_name: 'User',
  picture: ''
} as const;

// Mark mockUser as used
if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore - This is just for development
  window.__mockUser = mockUser;
}

// Create the AuthContext with proper typing
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// (useAuth is defined at the bottom to avoid duplicate declarations)

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }): JSX.Element => {
  // Initialize auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<OAuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Memoized config
  const config = useMemo(() => getRuntimeConfig(), []);
  
  // Memoized state object for context value
  const state = useMemo<AuthState>(() => ({
    isAuthenticated,
    user,
    tokens,
    isLoading,
    error
  }), [isAuthenticated, user, tokens, isLoading, error]);
  
  // Mark state as used
  if (process.env.NODE_ENV !== 'production') {
    // @ts-ignore - This is just for development
    window.__authState = state;
  }

  // (removed) safeSetUser was unused

  // Safe set tokens with null check
  const safeSetTokens = useCallback((newTokens: OAuthTokens | null) => {
    if (newTokens) {
      const tokensWithExpiry: OAuthTokens = {
        ...newTokens,
        expires_at: newTokens.expires_at || Math.floor(Date.now() / 1000) + 3600,
        refresh_expires_at: newTokens.refresh_expires_at || Math.floor(Date.now() / 1000) + 2592000
      };
      setTokens(tokensWithExpiry);
      oauthStorage.setTokens(tokensWithExpiry);
      return tokensWithExpiry;
    } else {
      setTokens(null);
      oauthStorage.clearTokens();
      return null;
    }
  }, []);
  
  // Mark safeSetTokens as used
  if (process.env.NODE_ENV !== 'production') {
    // @ts-ignore - This is just for development
    window.__safeSetTokens = safeSetTokens;
  }

  // Safe setUser that ensures sub is always set
  const safeSetUserWithSub = useCallback((userData: Partial<User> | null): User | null => {
    if (!userData) {
      setUser(null);
      return null;
    }
    
    // Ensure required fields are present
    const userWithRequiredFields: User = {
      sub: userData.sub || 'unknown',
      id: userData.id || userData.sub || 'unknown',
      email: userData.email || '',
      name: userData.name || '',
      given_name: userData.given_name || '',
      family_name: userData.family_name || '',
      picture: userData.picture || ''
    };
    
    setUser(userWithRequiredFields);
    return userWithRequiredFields;
  }, [setUser]);
  
  // Mark safeSetUserWithSub as used in development
  if (process.env.NODE_ENV !== 'production') {
    // @ts-ignore - This is just for development
    window.__safeSetUserWithSub = safeSetUserWithSub;
  }
 
  
  // Helper functions for OAuth flow (moved to a separate file in a real app)
  const generateRandomString = (length: number = 32): string => {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };


  // (removed) parseUrlParams was unused
  

  // Exchange code for tokens
  const exchangeCodeForTokens = async (code: string, codeVerifier: string): Promise<OAuthTokens & { expires_at?: number, refresh_expires_at?: number }> => {
    const config = getRuntimeConfig();
    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to exchange code for tokens');
    }

    const tokens = await response.json() as OAuthTokens;
    const now = Date.now();
    
    // Set access token expiration (default 1 hour)
    if (tokens.expires_in) {
      tokens.expires_at = now + (tokens.expires_in * 1000);
    } else {
      tokens.expires_at = now + (3600 * 1000); // Default 1 hour
    }
    
    // Set refresh token expiration (5 days)
    tokens.refresh_expires_at = now + (5 * 24 * 60 * 60 * 1000); // 5 days from now
    
    return tokens;
  };
  
  // Refresh access token using refresh token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const currentTokens = await oauthStorage.getTokens();
      if (!currentTokens?.refresh_token) {
        throw new Error('No refresh token available');
      }
      
      // Mark refreshAccessToken as used in development
      if (process.env.NODE_ENV !== 'production') {
        (window as WindowWithDevHelpers).__refreshAccessToken = refreshAccessToken;
      }

      const config = getRuntimeConfig();
      const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: currentTokens.refresh_token,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const tokens = await response.json() as OAuthTokens;
      const now = Date.now();
      
      // Update token expiration
      if (tokens.expires_in) {
        tokens.expires_at = Math.floor(now / 1000) + tokens.expires_in;
      } else if (!tokens.expires_at) {
        tokens.expires_at = Math.floor(now / 1000) + 3600; // default 1 hour
      }
      
      // Preserve the refresh token if not returned in the response
      if (!tokens.refresh_token) {
        tokens.refresh_token = currentTokens.refresh_token;
      }
      
      // Update refresh token expiration (extend for another 30 days)
      if (!tokens.refresh_expires_at) {
        tokens.refresh_expires_at = Math.floor(now / 1000) + (30 * 24 * 60 * 60);
      }
      
      // Persist and update state
      oauthStorage.setTokens(tokens);
      setTokens(tokens);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('❌ [AuthContext] Failed to refresh access token', err);
      return false;
    }
  }, []);

  // (removed) validateIdToken unused here; validation handled elsewhere when needed

  // Get user info from the UserInfo endpoint
  const getUserInfo = async (endpoint: string, accessToken: string): Promise<Partial<User>> => {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await response.json() as Partial<User>;
    return {
      ...userInfo,
      sub: userInfo.sub || 'anonymous',
    };
  };

  // (removed) ExtendedOAuthTokens unused

  // Using shared client logger from utils/clientLogger

  // Extend PingOneConfig interface to include disableLogin
interface AppConfig extends Omit<typeof config.pingone, 'disableLogin'> {
  disableLogin?: boolean;
}

  // Merge saved configuration from localStorage with env-based defaults
  function getRuntimeConfig(): AppConfig {
    console.log('🔍 [AuthContext] Reading configuration from localStorage...');
    try {
      const savedConfigRaw = localStorage.getItem('pingone_config');
      const savedCredsRaw = localStorage.getItem('login_credentials');
      
      console.log('🔍 [AuthContext] localStorage check:', {
        hasPingoneConfig: !!savedConfigRaw,
        hasLoginCredentials: !!savedCredsRaw
      });
      
      const savedConfig = savedConfigRaw ? JSON.parse(savedConfigRaw) : {};
      const savedCreds = savedCredsRaw ? JSON.parse(savedCredsRaw) : {};

      // Prefer explicit config from Configuration page; fall back to credentials from Login page
      const envId = savedConfig.environmentId || savedCreds.environmentId || config.pingone.environmentId;
      const apiUrl = config.pingone.apiUrl || 'https://auth.pingone.com';
      const baseUrl = `${apiUrl}/${envId}`;
      const authBase = `${baseUrl}/as`;

      // Map differences in key names (authEndpoint vs authorizationEndpoint)
      const authorizationEndpoint = savedConfig.authEndpoint || `${authBase}/authorize`;
      const tokenEndpoint = savedConfig.tokenEndpoint || `${authBase}/token`;
      // Normalize userInfoEndpoint to avoid accidental relative paths (e.g., "/flows/client-credentials")
      let userInfoEndpoint = savedConfig.userInfoEndpoint || `${authBase}/userinfo`;
      try {
        // If not a valid absolute URL, fallback to PingOne default
        // new URL(...) will throw for relative paths
         
        new URL(userInfoEndpoint);
      } catch {
        userInfoEndpoint = `${authBase}/userinfo`;
      }
      const logoutEndpoint = `${authBase}/signoff`;

      const finalConfig = {
        environmentId: envId,
        clientId: savedConfig.clientId || savedCreds.clientId || config.pingone.clientId,
        clientSecret: savedConfig.clientSecret || savedCreds.clientSecret || '',
        redirectUri: savedConfig.redirectUri || config.pingone.redirectUri,
        logoutRedirectUri: config.pingone.logoutRedirectUri,
        apiUrl,
        authServerId: '',
        baseUrl,
        // Add disableLogin flag (default to false if not set)
        disableLogin: savedConfig.disableLogin || false,
        authUrl: authBase,
        authorizationEndpoint,
        tokenEndpoint,
        userInfoEndpoint,
        logoutEndpoint,
      };

      console.log('✅ [AuthContext] Final configuration:', {
        environmentId: finalConfig.environmentId,
        hasClientId: !!finalConfig.clientId,
        hasClientSecret: !!finalConfig.clientSecret,
        hasRedirectUri: !!finalConfig.redirectUri,
        source: {
          fromPingoneConfig: !!savedConfig.environmentId,
          fromLoginCredentials: !!savedCreds.environmentId,
          fromDefaults: !savedConfig.environmentId && !savedCreds.environmentId
        }
      });

      return finalConfig;
    } catch (e) {
      console.warn('❌ [AuthContext] Failed to load runtime config, using defaults.', e);
      return config.pingone as AppConfig;
    }
  }

  // Helper function to check if token is valid
  const isTokenValid = useCallback((tokens: OAuthTokens | null): boolean => {
    if (!tokens?.expires_at) return false;
    return Date.now() < tokens.expires_at * 1000;
  }, []);

  // Helper function to check if refresh token is valid
  const isRefreshTokenValid = useCallback((tokens: OAuthTokens | null): boolean => {
    if (!tokens?.refresh_expires_at) return false;
    return Date.now() < tokens.refresh_expires_at * 1000;
  }, []);

  // Safe get tokens from storage
  const safeGetTokens = useCallback((): OAuthTokens | null => {
    try {
      return oauthStorage.getTokens();
    } catch (error) {
      console.error('Error getting tokens from storage:', error);
      return null;
    }
  }, []);

  // Safe get user info from storage
  const safeGetUserInfo = useCallback((): UserInfo | null => {
    try {
      return oauthStorage.getUserInfo();
    } catch (error) {
      console.error('Error getting user info from storage:', error);
      return null;
    }
  }, []);

  // Initialize auth state on mount with error boundary
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const [storedTokens, storedUser] = await Promise.all([
        safeGetTokens(),
        safeGetUserInfo()
      ]);

      if (storedTokens && isTokenValid(storedTokens)) {
        setTokens(storedTokens);
        setUser(storedUser);
        setIsAuthenticated(true);
      } else if (storedTokens?.refresh_token && isRefreshTokenValid(storedTokens)) {
        // Handle token refresh here if needed
        console.log('Token expired but refresh token is valid');
      } else {
        // Clear invalid tokens
        oauthStorage.clearAll();
        localStorage.removeItem('auth_tokens');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setError('Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Login function - handles both regular OAuth flow and disabled login mode
  const login = async (redirectAfterLogin: string = '/'): Promise<LoginResult> => {
    if (!config) {
      const errorMsg = 'Configuration not available';
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
    if (!config) {
      console.error('Configuration not available');
      return { success: false, error: 'Configuration not available' };
    }
    try {
      setIsLoading(true);
      setError(null);
      
      // Get config first
      const config = getRuntimeConfig();
      
      // Check if login is disabled
      if (config.disableLogin) {
        console.log('ℹ️ [AuthContext] Login is disabled, using mock user');
        // Create mock tokens that match OAuthTokenResponse type
        const mockTokens: OAuthTokenResponse = {
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          id_token: 'mock-id-token',
          scope: 'openid profile email'
        };
        
        // Create tokens with additional properties for storage
        const tokensForStorage = {
          ...mockTokens,
          expires_at: Date.now() + (3600 * 1000),
          refresh_expires_at: Date.now() + (5 * 24 * 60 * 60 * 1000) // 5 days
        };
        
        // Create a properly typed user object
        const mockUserInfo: UserInfo = {
          sub: 'mock-user-123',
          email: 'test@example.com',
          name: 'Test User',
          given_name: 'Test',
          family_name: 'User'
        };
        
        // Update state
        setTokens(tokensForStorage);
        setUser(mockUserInfo);
        setIsAuthenticated(true);
        
        // Save to storage with proper types
        oauthStorage.setTokens(mockTokens);
        oauthStorage.setUserInfo(mockUserInfo);
        localStorage.setItem('auth_tokens', JSON.stringify(tokensForStorage));
        
        return { success: true };
      }
      
      // Store the current path for redirect after login
      sessionStorage.setItem('redirect_after_login', redirectAfterLogin);
      
      // Check if we already have valid tokens
      const storedTokens = oauthStorage.getTokens() as OAuthTokens | null;
      
      // If we have valid tokens, use them
      if (storedTokens?.access_token) {
        const now = Date.now();
        const expiresAt = storedTokens.expires_at || 0;
        const isExpired = expiresAt ? now >= expiresAt : false;
        
        if (!isExpired) {
          console.log('✅ [AuthContext] Already authenticated with valid token');
          setTokens(storedTokens);
          setIsAuthenticated(true);
          
          // Restore user info
          const storedUser = oauthStorage.getUserInfo();
          if (storedUser) {
            safeSetUserWithSub(storedUser);
          } else {
            // Fetch fresh user info if not in storage
            try {
              const userInfo = await getUserInfo(config.userInfoEndpoint, storedTokens.access_token);
              safeSetUserWithSub(userInfo);
            } catch (error) {
              console.warn('⚠️ [AuthContext] Failed to fetch user info:', error);
            }
          }
          
          return { success: true };
        }
      }
      
      // If we get here, we need to start the OAuth flow
      try {
        const codeVerifier = generateRandomString(64);
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const state = generateRandomString(32);
        const nonce = generateRandomString(32);
        
        // Save PKCE verifier and state for later verification
        oauthStorage.setCodeVerifier(codeVerifier);
        oauthStorage.setState(state);
        oauthStorage.setNonce(nonce);
        
        // Build authorization URL
        const authUrl = new URL(config.authorizationEndpoint);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', config.clientId);
        authUrl.searchParams.append('redirect_uri', config.redirectUri);
        authUrl.searchParams.append('scope', 'openid profile email');
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('nonce', nonce);
        authUrl.searchParams.append('code_challenge', codeChallenge);
        authUrl.searchParams.append('code_challenge_method', 'S256');
        
        console.log('🔗 [AuthContext] Redirecting to authorization URL:', authUrl.toString());
        window.location.href = authUrl.toString();
        
        return { success: true };
      } catch (error) {
        console.error('❌ [AuthContext] Error starting OAuth flow:', error);
        setError('Failed to start authentication');
        return { success: false };
      }

      // This code is now handled in the login function above
    } catch (error) {
      console.error('❌ [AuthContext] Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function with error handling
  const logout = () => {
    try {
      // Clear all auth-related data
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/') {
        sessionStorage.setItem('redirect_after_logout', currentPath);
      }
      
      // Clear all stored data
      oauthStorage.clearAll();
      
      // Update state
      setUser(null);
      setTokens(null);
      setIsAuthenticated(false);
      
      console.log('✅ [AuthContext] Local logout complete, redirecting to logout endpoint');
      clientLog('info', '[AuthContext] Local logout complete');
      
      // Redirect to PingOne logout endpoint if available
      if (config.logoutEndpoint) {
        const logoutUrl = new URL(config.logoutEndpoint);
        logoutUrl.searchParams.append('client_id', config.clientId);
        logoutUrl.searchParams.append('post_logout_redirect_uri', window.location.origin);
        window.location.href = logoutUrl.toString();
      } else {
        // Fallback to home page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('❌ [AuthContext] Logout error:', error);
      setError(error instanceof Error ? error.message : 'Logout failed');
    }
  };

  // Handle OAuth callback
  const handleCallback = useCallback(async (callbackUrl: string): Promise<LoginResult> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Parse callback URL
      const params = new URLSearchParams(new URL(callbackUrl).search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');
      const savedState = oauthStorage.getState();
      
      if (error) {
        const errorDesc = params.get('error_description') || 'Authentication failed';
        setError(errorDesc);
        return { success: false, error: errorDesc };
      }
      
      if (!code) {
        const errorMsg = 'No authorization code found in callback URL';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      if (state !== savedState) {
        const errorMsg = 'Invalid state parameter';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      const codeVerifier = oauthStorage.getCodeVerifier();
      try {
        console.debug('[AuthContext] Callback values', {
          has_code: !!code,
          has_state: !!state,
          has_saved_state: !!savedState,
          has_code_verifier: !!codeVerifier,
        });
      } catch {}

      // If OAuthContext initiated the flow, skip handling here
      const ocFlowType = sessionStorageService.getItem('oauth_flow_type');
      if (ocFlowType) {
        console.debug('[AuthContext] Skipping callback: oauth_flow_type present, handled by OAuthContext');
        clientLog('debug', '[AuthContext] Skipping callback due to oauth_flow_type', { ocFlowType });
        setIsLoading(false);
        return { success: true };
      }
      
      // Check for errors
      if (error) {
        throw new Error(`Authorization failed: ${error}`);
      }
      
      // Validate state and code
      if (!code || !state || state !== savedState) {
        throw new Error('Invalid authorization response');
      }
      
      if (!codeVerifier) {
        throw new Error('Missing code verifier');
      }
      
      // Exchange code for tokens using local helper
      const config = getRuntimeConfig();
      console.debug('[AuthContext] Exchanging code for tokens at:', config.tokenEndpoint, {
        has_client_secret: !!config.clientSecret,
        code_verifier_len: codeVerifier?.length || 0,
      });
      clientLog('info', '[AuthContext] Exchanging code for tokens', {
        endpoint: config.tokenEndpoint,
      });
      const tokens = await exchangeCodeForTokens(code!, codeVerifier!);
      if (!tokens.expires_in) {
        tokens.expires_in = 3600; // Default to 1 hour if not provided
      }
      if (tokens.expires_in) {
        tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
      }
      
      // Store tokens with all necessary properties
      const tokensForStore: OAuthTokenResponse = {
        access_token: tokens.access_token,
        token_type: tokens.token_type ?? 'Bearer',
        expires_in: tokens.expires_in,
        ...(tokens.refresh_token && { refresh_token: tokens.refresh_token }),
        ...(tokens.id_token && { id_token: tokens.id_token }),
        ...(tokens.scope && { scope: tokens.scope }),
      } as OAuthTokenResponse;
      
      // Add expires_at as a non-standard property
      const tokensWithExpiry = {
        ...tokensForStore,
        expires_at: tokens.expires_at
      };
      
      // Save tokens to storage
      oauthStorage.setTokens(tokensForStore);
      
      // Also save to localStorage for persistence across page refreshes
      localStorage.setItem('auth_tokens', JSON.stringify(tokensWithExpiry));
      
      console.log('🔑 [AuthContext] Tokens stored:', {
        hasAccessToken: !!tokensForStore.access_token,
        hasRefreshToken: !!tokensForStore.refresh_token,
        expiresAt: tokensWithExpiry.expires_at ? new Date(tokensWithExpiry.expires_at).toISOString() : 'no expiry'
      });
      
      // Get user info
      const userInfo = await getUserInfo(config.userInfoEndpoint, tokens.access_token);
      const user = safeSetUserWithSub(userInfo);
      if (user) {
        const toStore: UserInfo = {
          sub: user.sub,
          ...(user.email !== undefined ? { email: user.email as string } : {}),
          ...(user.name !== undefined ? { name: user.name as string } : {}),
          ...(user.given_name !== undefined ? { given_name: user.given_name as string } : {}),
          ...(user.family_name !== undefined ? { family_name: user.family_name as string } : {}),
          ...(user.picture !== undefined ? { picture: user.picture as unknown as string } : {}),
        };
        oauthStorage.setUserInfo(toStore);
      }

      // Update state
      setTokens(tokens);
      setIsAuthenticated(true);

      // Redirect to the originally requested page or home
      const redirectTo = sessionStorage.getItem('redirect_after_login') || '/';
      sessionStorage.removeItem('redirect_after_login');
      window.location.href = redirectTo;
      return { success: true };
      
    } catch (error) {
      console.error('❌ [AuthContext] Callback error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to handle callback';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, [getRuntimeConfig, exchangeCodeForTokens, getUserInfo, setTokens, setIsAuthenticated, setIsLoading, setError]);

  // Create the context value
  const contextValue: AuthContextType = useMemo(() => ({
    isAuthenticated,
    user,
    tokens,
    isLoading,
    error,
    login,
    logout,
    handleCallback,
    refreshAccessToken,
    setAuthState: (updates: Partial<AuthState>) => {
      if (updates.user !== undefined) setUser(updates.user);
      if (updates.tokens !== undefined) setTokens(updates.tokens);
      if (updates.isAuthenticated !== undefined) setIsAuthenticated(updates.isAuthenticated);
      if (updates.isLoading !== undefined) setIsLoading(updates.isLoading);
      if (updates.error !== undefined) setError(updates.error);
    }
  }), [
    isAuthenticated, 
    user, 
    tokens, 
    isLoading, 
    login, 
    logout, 
    handleCallback, 
    refreshAccessToken, 
    setUser, 
    setTokens, 
    setIsAuthenticated, 
    setIsLoading, 
    setError
  ]);

  // Wrap children with ErrorBoundary
  return (
    <ErrorBoundary 
      fallback={
        <div className="p-4 bg-red-50 text-red-700 rounded m-4">
          <h3 className="font-bold">Authentication Error</h3>
          <p>There was an error in the authentication process. Please refresh the page or try again later.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
          >
            Refresh Page
          </button>
        </div>
      }
    >
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    </ErrorBoundary>
  ) as JSX.Element;
};

// Custom hook to use AuthContext with proper error handling
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
