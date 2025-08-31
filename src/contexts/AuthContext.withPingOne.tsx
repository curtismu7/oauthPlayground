import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { oauthStorage } from '../utils/storage';
import { pingOneConfig } from '../config/pingone';
import PingOneSessionManager from '../utils/pingoneSession';

// Extend the OAuthTokens interface to include session info
interface OAuthTokens {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  session_state?: string;
}

interface User {
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
  sessionInfo?: any;
  sessionRemainingTime?: number;
}

interface AuthContextType extends AuthState {
  login: () => Promise<{ success: boolean }>;
  logout: () => void;
  handleCallback: (callbackUrl: string) => Promise<void>;
  setAuthState: (updates: Partial<AuthState>) => void;
  refreshSession: () => Promise<boolean>;
  getSessionInfo: () => Promise<any>;
  configureSession: (lifetimeMinutes: number, idleTimeoutMinutes?: number) => Promise<boolean>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize session manager with default config
let sessionManager: PingOneSessionManager;

// Helper to get runtime config
const getRuntimeConfig = () => ({
  clientId: process.env.REACT_APP_CLIENT_ID || pingOneConfig.clientId,
  clientSecret: process.env.REACT_APP_CLIENT_SECRET || pingOneConfig.clientSecret,
  authBaseUrl: pingOneConfig.authBaseUrl,
  tokenEndpoint: `${pingOneConfig.authBaseUrl}/${pingOneConfig.envId}/as/token`,
  userInfoEndpoint: `${pingOneConfig.authBaseUrl}/${pingOneConfig.envId}/userinfo`,
  redirectUri: window.location.origin + '/callback',
  envId: pingOneConfig.envId,
  domain: pingOneConfig.domain,
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    tokens: null,
    isLoading: true,
    error: null,
    sessionInfo: null,
    sessionRemainingTime: 0,
  });

  // Initialize session manager
  useEffect(() => {
    const config = getRuntimeConfig();
    sessionManager = new PingOneSessionManager({
      envId: config.envId,
      domain: config.domain,
      clientId: config.clientId,
      redirectUri: config.redirectUri,
    });

    // Initialize session checking
    const initAuth = async () => {
      try {
        const hasActiveSession = await sessionManager.init();
        const storedTokens = oauthStorage.getTokens() as OAuthTokens | null;
        
        if (hasActiveSession && storedTokens) {
          // Refresh user info
          const userInfo = await getUserInfo(config.userInfoEndpoint, storedTokens.access_token);
          const sessionInfo = await sessionManager.getSessionInfo(storedTokens.access_token);
          
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: userInfo,
            tokens: storedTokens,
            sessionInfo,
            isLoading: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to initialize authentication',
        }));
      }
    };

    initAuth();

    // Cleanup on unmount
    return () => {
      if (sessionManager) {
        // @ts-ignore - clearSession is available
        sessionManager.clearSession();
      }
    };
  }, []);

  // Update session remaining time
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const timer = setInterval(() => {
      const remainingTime = sessionManager.getRemainingSessionTime();
      setState(prev => ({
        ...prev,
        sessionRemainingTime: Math.max(0, Math.floor(remainingTime)),
      }));

      // Auto-logout when session expires
      if (remainingTime <= 0) {
        logout();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [state.isAuthenticated]);

  // Helper to update state
  const setAuthState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      error: updates.error || null, // Reset error if not provided
    }));
  }, []);

  // Get user info from UserInfo endpoint
  const getUserInfo = async (endpoint: string, accessToken: string): Promise<User> => {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return await response.json() as User;
  };

  // Login function with PKCE
  const login = async (): Promise<{ success: boolean }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Generate PKCE code verifier and challenge
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(32);
      const nonce = generateRandomString(32);

      // Store PKCE data
      oauthStorage.setCodeVerifier(codeVerifier);
      oauthStorage.setState(state);
      oauthStorage.setNonce(nonce);
      oauthStorage.setSessionStartTime(Date.now());

      // Store current URL for redirect after login
      const redirectAfterLogin = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirect_after_login', redirectAfterLogin);

      // Build authorization URL with prompt=none to check for existing session
      const config = getRuntimeConfig();
      const authUrl = new URL(`${config.authBaseUrl}/${config.envId}/as/authorize`);
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: 'openid profile email',
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'none', // Try silent authentication first
      });

      authUrl.search = params.toString();
      
      // Open in a popup for better UX
      const popup = window.open(
        authUrl.toString(),
        'pingone-login',
        'width=600,height=600,resizable=yes,scrollbars=yes,status=yes'
      );

      // Check if popup was blocked
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return { success: false };
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
        // If silent auth failed, try with login prompt
        if (error === 'login_required') {
          // Remove prompt=none and try again
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete('prompt');
          window.location.href = currentUrl.toString();
          return;
        }
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
        credentials: 'include', // Important for session cookies
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
      
      // Store tokens and get user info
      oauthStorage.setTokens(tokens);
      const userInfo = await getUserInfo(config.userInfoEndpoint, tokens.access_token);
      
      // Get session info
      const sessionInfo = await sessionManager.getSessionInfo(tokens.access_token);
      
      // Update state
      setState({
        isAuthenticated: true,
        user: userInfo,
        tokens,
        sessionInfo,
        sessionRemainingTime: sessionManager.getRemainingSessionTime(),
        isLoading: false,
        error: null,
      });
      
      // Redirect to original URL or home
      const redirectTo = sessionStorage.getItem('redirect_after_login') || '/';
      sessionStorage.removeItem('redirect_after_login');
      window.location.href = redirectTo;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to handle callback';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      throw error;
    }
  };

  // Logout function with PingOne SSO logout
  const logout = (): void => {
    try {
      const config = getRuntimeConfig();
      
      // Clear local state and storage
      oauthStorage.clearAll();
      if (sessionManager) {
        sessionManager.clearSession();
      }
      
      // Redirect to PingOne logout endpoint for SSO logout
      const logoutUrl = new URL(`${config.authBaseUrl}/${config.envId}/as/terminate`);
      logoutUrl.searchParams.append('client_id', config.clientId);
      logoutUrl.searchParams.append('post_logout_redirect_uri', window.location.origin);
      
      // Clear state
      setState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: null,
        sessionInfo: null,
        sessionRemainingTime: 0,
      });
      
      // Redirect to logout
      window.location.href = logoutUrl.toString();
      
    } catch (error) {
      console.error('Logout error:', error);
      // Redirect to home on error
      window.location.href = '/';
    }
  };

  // Refresh session
  const refreshSession = async (): Promise<boolean> => {
    try {
      const { tokens } = state;
      if (!tokens?.refresh_token) return false;

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
          refresh_token: tokens.refresh_token,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh tokens');
      }

      const newTokens = await response.json() as OAuthTokens;
      if (newTokens.expires_in) {
        newTokens.expires_at = Date.now() + (newTokens.expires_in * 1000);
      }

      // Update stored tokens
      oauthStorage.setTokens(newTokens);
      
      // Update state
      setState(prev => ({
        ...prev,
        tokens: newTokens,
      }));

      return true;
    } catch (error) {
      console.error('Session refresh failed:', error);
      logout();
      return false;
    }
  };

  // Get current session info
  const getSessionInfo = async (): Promise<any> => {
    try {
      if (!state.tokens?.access_token) {
        throw new Error('No active session');
      }
      
      const sessionInfo = await sessionManager.getSessionInfo(state.tokens.access_token);
      setState(prev => ({
        ...prev,
        sessionInfo,
      }));
      
      return sessionInfo;
    } catch (error) {
      console.error('Failed to get session info:', error);
      throw error;
    }
  };

  // Configure session lifetime
  const configureSession = async (lifetimeMinutes: number, idleTimeoutMinutes?: number): Promise<boolean> => {
    try {
      if (!state.tokens?.access_token) {
        throw new Error('No active session');
      }
      
      const success = await sessionManager.configureSessionLifetime(
        state.tokens.access_token,
        lifetimeMinutes,
        idleTimeoutMinutes
      );
      
      if (success) {
        // Refresh session info to get updated settings
        await getSessionInfo();
      }
      
      return success;
    } catch (error) {
      console.error('Failed to configure session:', error);
      throw error;
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    handleCallback,
    setAuthState,
    refreshSession,
    getSessionInfo,
    configureSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper functions
function generateRandomString(length: number = 32): string {
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

// Hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
