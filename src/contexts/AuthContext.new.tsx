import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { oauthStorage } from '../utils/storage';
import { config } from '../services/config';

// Interfaces
export interface OAuthTokens {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  scope?: string;
}

export interface User {
  sub: string;
  id?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  [key: string]: unknown;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: OAuthTokens | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: () => Promise<{ success: boolean }>;
  logout: () => void;
  handleCallback: (callbackUrl: string) => Promise<void>;
  setAuthState: (updates: Partial<AuthState>) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    tokens: null,
    isLoading: true,
    error: null
  });

  // Helper to update state
  const setAuthState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      error: updates.error !== undefined ? updates.error : null
    }));
  }, []);

  // Safe setUser that ensures sub is always set
  const safeSetUser = useCallback((userData: Partial<User> | null) => {
    if (!userData) {
      setState(prev => ({ ...prev, user: null }));
      return null;
    }
    
    const user: User = {
      sub: userData.sub || 'anonymous',
      id: userData.id,
      email: userData.email,
      name: userData.name,
      given_name: userData.given_name,
      family_name: userData.family_name,
      picture: userData.picture,
      ...(userData as Record<string, unknown>)
    };
    
    setState(prev => ({ ...prev, user }));
    return user;
  }, []);

  // Generate random string for state/nonce
  const generateRandomString = (length = 32): string => {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  // Generate PKCE code challenge from verifier
  const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  // Get user info from UserInfo endpoint
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

    return await response.json() as Partial<User>;
  };

  // Get runtime config
  const getRuntimeConfig = () => {
    // In a real app, this would come from your config
    return {
      clientId: process.env.REACT_APP_CLIENT_ID || 'default-client-id',
      clientSecret: process.env.REACT_APP_CLIENT_SECRET || 'default-client-secret',
      authorizationEndpoint: process.env.REACT_APP_AUTH_ENDPOINT || 'https://auth.pingone.com/authorize',
      tokenEndpoint: process.env.REACT_APP_TOKEN_ENDPOINT || 'https://auth.pingone.com/token',
      userInfoEndpoint: process.env.REACT_APP_USERINFO_ENDPOINT || 'https://auth.pingone.com/userinfo',
      logoutEndpoint: process.env.REACT_APP_LOGOUT_ENDPOINT || 'https://auth.pingone.com/logout',
      redirectUri: process.env.REACT_APP_REDIRECT_URI || `${window.location.origin}/callback`,
      scopes: 'openid profile email'
    };
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedTokens = oauthStorage.getTokens() as OAuthTokens | null;
        const storedUser = oauthStorage.getUserInfo();

        if (storedTokens?.access_token) {
          const now = Date.now();
          const expiresAt = storedTokens.expires_at || 0;
          const isExpired = expiresAt ? now >= expiresAt : false;

          if (!isExpired) {
            setState(prev => ({
              ...prev,
              isAuthenticated: true,
              tokens: storedTokens,
              user: storedUser,
              isLoading: false
            }));

            // Refresh user info if needed
            if (!storedUser) {
              try {
                const config = getRuntimeConfig();
                const userInfo = await getUserInfo(config.userInfoEndpoint, storedTokens.access_token);
                const user = safeSetUser(userInfo);
                oauthStorage.setUserInfo(user);
              } catch (error) {
                console.warn('Failed to refresh user info:', error);
              }
            }
            return;
          }
          
          // Clear expired tokens
          oauthStorage.clearTokens();
          oauthStorage.clearUserInfo();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, [safeSetUser]);

  // Login function
  const login = async (): Promise<{ success: boolean }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check for existing valid tokens
      const storedTokens = oauthStorage.getTokens() as OAuthTokens | null;
      if (storedTokens?.access_token) {
        const now = Date.now();
        const expiresAt = storedTokens.expires_at || 0;
        const isExpired = expiresAt ? now >= expiresAt : false;

        if (!isExpired) {
          const storedUser = oauthStorage.getUserInfo();
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: storedUser,
            tokens: storedTokens,
            isLoading: false
          }));
          return { success: true };
        }
      }

      // Generate PKCE code verifier and challenge
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(32);
      const nonce = generateRandomString(32);

      // Store PKCE data
      oauthStorage.setCodeVerifier(codeVerifier);
      oauthStorage.setState(state);
      oauthStorage.setNonce(nonce);

      // Store current URL for redirect after login
      const redirectAfterLogin = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirect_after_login', redirectAfterLogin);

      // Build authorization URL
      const config = getRuntimeConfig();
      const authUrl = new URL(config.authorizationEndpoint);
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: config.scopes,
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      authUrl.search = params.toString();
      window.location.href = authUrl.toString();

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false };
    }
  };

  // Logout function
  const logout = (): void => {
    try {
      const config = getRuntimeConfig();
      
      // Store current path for post-logout redirect
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/') {
        sessionStorage.setItem('redirect_after_logout', currentPath);
      }
      
      // Clear auth state
      oauthStorage.clearAll();
      setState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: null
      });
      
      // Redirect to logout endpoint
      if (config.logoutEndpoint) {
        const logoutUrl = new URL(config.logoutEndpoint);
        logoutUrl.searchParams.append('client_id', config.clientId);
        logoutUrl.searchParams.append('post_logout_redirect_uri', window.location.origin);
        window.location.href = logoutUrl.toString();
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  // Handle OAuth callback
  const handleCallback = async (callbackUrl: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Parse callback URL
      const params = new URLSearchParams(new URL(callbackUrl).search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');
      const savedState = oauthStorage.getState();
      const codeVerifier = oauthStorage.getCodeVerifier();
      
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
      
      // Exchange code for tokens
      const config = getRuntimeConfig();
      const tokenResponse = await fetch(config.tokenEndpoint, {
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
      
      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(error.error_description || 'Failed to exchange code for tokens');
      }
      
      // Parse and store tokens
      const tokens = await tokenResponse.json() as OAuthTokens;
      if (tokens.expires_in) {
        tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
      }
      
      // Store tokens
      oauthStorage.setTokens(tokens);
      
      // Get user info
      const userInfo = await getUserInfo(config.userInfoEndpoint, tokens.access_token);
      const user = safeSetUser(userInfo);
      oauthStorage.setUserInfo(user);
      
      // Update state
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        tokens,
        user,
        isLoading: false
      }));
      
      // Redirect to original URL or home
      const redirectTo = sessionStorage.getItem('redirect_after_login') || '/';
      sessionStorage.removeItem('redirect_after_login');
      window.location.href = redirectTo;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to handle callback';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      throw error;
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    handleCallback,
    setAuthState
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
