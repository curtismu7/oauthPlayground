import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { oauthStorage } from '../utils/storage';
import { pingOneConfig } from '../config/pingone';

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
  sub: string; // Required unique identifier
  id?: string | undefined; // Optional id (some providers use 'id' instead of 'sub')
  email?: string | undefined;
  name?: string | undefined;
  given_name?: string | undefined;
  family_name?: string | undefined;
  picture?: string | undefined;
  [key: string]: unknown; // Allow additional properties with unknown type
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: OAuthTokens | null;
  isLoading: boolean;
  error: string | null;
}

interface LoginResult { success: boolean }

interface AuthContextType extends AuthState {
  login: () => Promise<LoginResult>;
  logout: () => void;
  handleCallback: (callbackUrl: string) => Promise<void>;
  setAuthState: (state: Partial<AuthState>) => void;
}

// Create the AuthContext with proper typing
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component with proper TypeScript props
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tokens, setTokens] = useState<OAuthTokens | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Safe setUser that ensures sub is always set
  const safeSetUser = useCallback((userData: Partial<User> | null) => {
    if (!userData) {
      setUser(null);
      return null;
    }
    
    // Ensure sub is always set
    const sub = userData.sub || 'anonymous';
    
    // Create a new user object with all required fields
    const user: User = {
      sub,
      id: userData.id,
      email: userData.email,
      name: userData.name,
      given_name: userData.given_name,
      family_name: userData.family_name,
      picture: userData.picture,
      ...(userData as Record<string, unknown>)
    };
    
    setUser(user);
    return user;
  }, [setUser]);
  
  // Generate a random string for state/nonce
  const generateRandomString = (length: number = 32): string => {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  // Generate PKCE code challenge from verifier
  const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };


  // Parse URL parameters
  const parseUrlParams = (url: string): Record<string, string> => {
    try {
      const params = new URLSearchParams(new URL(url).search);
      return Object.fromEntries(params.entries());
    } catch (error) {
      console.error('Error parsing URL parameters:', error);
      return {};
    }
  };
  
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
    return userInfo;
  };

  // Exchange code for tokens
  const exchangeCodeForTokens = async (code: string, codeVerifier: string): Promise<OAuthTokens & { expires_at?: number }> => {
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

    const tokens = await response.json() as OAuthTokens & { expires_at?: number };
    
    // Add expiration timestamp if expires_in is present
    if (tokens.expires_in) {
      tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
    }
    
    return tokens;
  };

  // Validate ID token
  const validateIdToken = (idToken: string): boolean => {
    // In a real app, you would validate the JWT signature, issuer, audience, etc.
    // This is a simplified version that just checks if the token exists
    return !!idToken;
  };

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
  
  // Extend OAuthTokens interface to include expires_at
  interface ExtendedOAuthTokens extends OAuthTokens {
    expires_at?: number;
  }

  // Lightweight client logger to Vite middleware (logs/server.log)
  const clientLog = async (message: string) => {
    try {
      await fetch('/__log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        keepalive: true,
      });
    } catch {
      // no-op
    }
  };

  // Merge saved configuration from localStorage with env-based defaults
  const getRuntimeConfig = () => {
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
      const envId = savedConfig.environmentId || savedCreds.environmentId || pingOneConfig.environmentId;
      const apiUrl = pingOneConfig.apiUrl || 'https://auth.pingone.com';
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
        // eslint-disable-next-line no-new
        new URL(userInfoEndpoint);
      } catch {
        userInfoEndpoint = `${authBase}/userinfo`;
      }
      const logoutEndpoint = `${authBase}/signoff`;

      const finalConfig = {
        environmentId: envId,
        clientId: savedConfig.clientId || savedCreds.clientId || pingOneConfig.clientId,
        clientSecret: savedConfig.clientSecret || savedCreds.clientSecret || pingOneConfig.clientSecret,
        redirectUri: savedConfig.redirectUri || pingOneConfig.redirectUri,
        logoutRedirectUri: pingOneConfig.logoutRedirectUri,
        apiUrl,
        authServerId: pingOneConfig.authServerId,
        baseUrl,
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
      return pingOneConfig;
    }
  };

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 [AuthContext] Initializing authentication...');
        clientLog('[AuthContext] Initializing authentication...');

        // Get stored tokens and user info
        const storedTokens = oauthStorage.getTokens() as OAuthTokens | null;
        const storedUser = oauthStorage.getUserInfo();
        
        console.log('🔍 [AuthContext] Retrieved stored data:', {
          hasTokens: !!storedTokens,
          hasUser: !!storedUser
        });

        if (storedTokens?.access_token) {
          console.log('🔍 [AuthContext] Validating stored token...');
          clientLog('[AuthContext] Validating stored token...');

          // Check if token is still valid (not expired)
          const now = Date.now();
          const expiresAt = storedTokens.expires_at || 0;
          const isExpired = expiresAt ? now >= expiresAt : false;

          console.log('🔍 [AuthContext] Token validation:', {
            currentTime: new Date(now).toISOString(),
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : 'no expiry set',
            isExpired
          });
          
          if (!isExpired) {
            // Token is still valid, restore state
            setTokens(storedTokens);
            setIsAuthenticated(true);
            
            if (storedUser) {
              safeSetUser(storedUser);
              console.log('✅ [AuthContext] Restored user from storage');
            } else {
              // Try to fetch fresh user info
              try {
                const config = getRuntimeConfig();
                console.log('🔍 [AuthContext] Fetching fresh user info...');
                const userInfo = await getUserInfo(config.userInfoEndpoint, storedTokens.access_token);
                const user = safeSetUser(userInfo);
                oauthStorage.setUserInfo(user);
              } catch (error) {
                console.warn('⚠️ [AuthContext] Failed to fetch user info:', error);
                // Continue with stored tokens even if user info fetch fails
              }
            }
            
            console.log('✅ [AuthContext] Authentication state restored');
          } else {
            console.log('⚠️ [AuthContext] Token expired, clearing storage');
            oauthStorage.clearTokens();
            oauthStorage.clearUserInfo();
          }
        } else {
          console.log('ℹ️ [AuthContext] No valid tokens found');
          oauthStorage.clearTokens();
          oauthStorage.clearUserInfo();
        }
      } catch (error) {
        console.error('❌ [AuthContext] Error initializing auth:', error);
        oauthStorage.clearAll();
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, [safeSetUser]);
  
  // Login function
  const login = async (): Promise<LoginResult> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we already have valid tokens
      const storedTokens = oauthStorage.getTokens() as OAuthTokens | null;
      if (storedTokens?.access_token) {
        const now = Date.now();
        const expiresAt = storedTokens.expires_at || 0;
        const isExpired = expiresAt ? now >= expiresAt : false;
        
        if (!isExpired) {
          console.log('✅ [AuthContext] Already authenticated with valid token');
          setTokens(storedTokens);
          setIsAuthenticated(true);
          
          // Try to restore user info
          const storedUser = oauthStorage.getUserInfo();
          if (storedUser) {
            safeSetUser(storedUser);
          } else {
            // Fetch fresh user info if not in storage
            try {
              const config = getRuntimeConfig();
              const userInfo = await getUserInfo(config.userInfoEndpoint, storedTokens.access_token);
              const user = safeSetUser(userInfo);
              oauthStorage.setUserInfo(user);
            } catch (error) {
              console.warn('⚠️ [AuthContext] Failed to fetch user info:', error);
            }
          }
          
          return { success: true };
        }
      }
      
      // If we get here, we need to authenticate
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(32);
      const nonce = generateRandomString(32);
      
      // Save PKCE verifier and state for later verification
      oauthStorage.setCodeVerifier(codeVerifier);
      oauthStorage.setState(state);
      oauthStorage.setNonce(nonce);
      
      // Store current URL for redirect after login
      const redirectAfterLogin = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirect_after_login', redirectAfterLogin);
      
      // Get config and build authorization URL
      const config = getRuntimeConfig();
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
      console.error('❌ [AuthContext] Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = (): void => {
    try {
      // Get config before clearing storage
      const config = getRuntimeConfig();
      
      // Store current path for post-logout redirect
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
      clientLog('[AuthContext] Local logout complete');
      
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
      window.location.href = '/';
    }
  };
  
  // Handle OAuth callback
  const handleCallback = async (callbackUrl: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
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
      setTokens(tokens);
      setIsAuthenticated(true);
      
      // Redirect to the originally requested page or home
      const redirectTo = sessionStorage.getItem('redirect_after_login') || '/';
      sessionStorage.removeItem('redirect_after_login');
      window.location.href = redirectTo;
      
    } catch (error) {
      console.error('❌ [AuthContext] Callback error:', error);
      setError(error instanceof Error ? error.message : 'Failed to handle callback');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create the context value
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    tokens,
    isLoading,
    error,
    login,
    logout,
    handleCallback,
    setAuthState: (updates: Partial<AuthState>) => {
      if (updates.user !== undefined) safeSetUser(updates.user);
      if (updates.tokens !== undefined) setTokens(updates.tokens);
      if (updates.isAuthenticated !== undefined) setIsAuthenticated(updates.isAuthenticated);
      if (updates.isLoading !== undefined) setIsLoading(updates.isLoading);
      if (updates.error !== undefined) setError(updates.error);
    }
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
            isExpired
          });

          if (!isExpired) {
            setTokens(storedTokens);
            setIsAuthenticated(true);
            
            if (storedUser) {
              safeSetUser(storedUser);
              console.log('✅ [AuthContext] Restored user from storage:', storedUser);
            } else {
              // Try to fetch fresh user info if not in storage
            try {
              const cfg = getRuntimeConfig();
              console.log('🔍 [AuthContext] Fetching fresh user info from:', cfg.userInfoEndpoint);
              const userInfo = await getUserInfo(cfg.userInfoEndpoint, storedTokens.access_token);
              const user: Partial<User> = {
                ...userInfo,
                sub: userInfo.sub || 'anonymous'
              };
              oauthStorage.setUserInfo(user);
              safeSetUser(user);
              console.log('✅ [AuthContext] User info retrieved and stored successfully');
            } catch (error) {
              console.warn('⚠️ [AuthContext] Failed to fetch user info:', error);
              // Continue with stored tokens even if user info fetch fails
            }
          }

          setIsAuthenticated(true);
          setTokens(storedTokens);
          console.log('✅ [AuthContext] Authentication state restored successfully');
        }
      } else {
        console.log('ℹ️ [AuthContext] No tokens found in storage');
        clientLog('[AuthContext] No tokens found in storage');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ [AuthContext] Auth initialization failed:', error);
      clientLog('[AuthContext] Auth initialization failed');
      oauthStorage.clearTokens();
      oauthStorage.clearAll();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log('✅ [AuthContext] Authentication initialization complete');
      clientLog('[AuthContext] Authentication initialization complete');
    }
  };

  initializeAuth();
}, [safeSetUser]);

// Logout function
const logout = (): void => {
  try {
    // Get config before clearing storage
    const config = getRuntimeConfig();
    
    // Store current path for post-logout redirect
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
    clientLog('[AuthContext] Local logout complete');
    
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
    console.error('Logout error:', error);
    setError(error instanceof Error ? error.message : 'Failed to logout');
    // Still try to redirect even if there was an error
    window.location.href = '/';
  }
};

// Login function
const login = async (): Promise<LoginResult> => {
  try {
    setIsLoading(true);
    setError(null);
    
    // Check if we already have valid tokens
    const storedTokens = oauthStorage.getTokens();
    if (storedTokens?.access_token) {
      const now = Date.now();
      const expiresAt = storedTokens.expires_at || 0;
      const isExpired = expiresAt ? now >= expiresAt : false;
      
      if (!isExpired) {
        console.log('✅ [AuthContext] Already authenticated with valid token');
        setTokens(storedTokens);
        setIsAuthenticated(true);
        
        // Try to restore user info
        const storedUser = oauthStorage.getUserInfo();
        if (storedUser) {
          safeSetUser(storedUser);
        } else {
          // Fetch fresh user info if not in storage
          try {
            const config = getRuntimeConfig();
            const userInfo = await getUserInfo(config.userInfoEndpoint, storedTokens.access_token);
            const user: Partial<User> = { ...userInfo, sub: userInfo.sub || 'anonymous' };
            oauthStorage.setUserInfo(user);
            safeSetUser(user);
          } catch (error) {
            console.warn('⚠️ [AuthContext] Failed to fetch user info:', error);
          }
        }
        
        return { success: true };
      }
    }
    
    // If we get here, we need to authenticate
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);
    const nonce = generateRandomString(32);
    
    // Save PKCE verifier and state for later verification
    oauthStorage.setCodeVerifier(codeVerifier);
    oauthStorage.setState(state);
    oauthStorage.setNonce(nonce);
    
    // Get current configuration
    const config = getRuntimeConfig();
    
    // Store the current URL for post-login redirect
    const redirectAfterLogin = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirect_after_login', redirectAfterLogin);
    
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
    
    // Redirect to authorization server
    window.location.href = authUrl.toString();
    
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    setError(error instanceof Error ? error.message : 'Failed to initiate login');
    return { success: false };
  } finally {
    setIsLoading(false);
  }
      if (updates.user !== undefined) safeSetUser(updates.user);
      if (updates.isAuthenticated !== undefined) setIsAuthenticated(updates.isAuthenticated);
      if (updates.tokens !== undefined) setTokens(updates.tokens);
      if (updates.isLoading !== undefined) setIsLoading(updates.isLoading);
      if (updates.error !== undefined) setError(updates.error);
    }
  };

  // Create the context value
  const value: AuthContextType = {
    isAuthenticated,
    user,
    tokens,
    isLoading,
    error,
    login,
    logout,
    handleCallback: async (callbackUrl: string) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams(new URL(callbackUrl).search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        const savedState = oauthStorage.getState();
        const codeVerifier = oauthStorage.getCodeVerifier();
        
        if (error) {
          throw new Error(`Authorization failed: ${error}`);
        }
        
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
        
        const tokens = await tokenResponse.json() as OAuthTokens;
        
        // Store tokens with expiration
        if (tokens.expires_in) {
          tokens.expires_at = Date.now() + (tokens.expires_in * 1000);
        }
        oauthStorage.setTokens(tokens);
        
        // Get user info
        const userInfo = await getUserInfo(config.userInfoEndpoint, tokens.access_token);
        const user: User = { ...userInfo, sub: userInfo.sub || 'anonymous' };
        oauthStorage.setUserInfo(user);
        
        // Update state
        setTokens(tokens);
        safeSetUser(user);
        setIsAuthenticated(true);
        
        // Redirect to the originally requested page or home
        const redirectTo = sessionStorage.getItem('redirect_after_login') || '/';
        sessionStorage.removeItem('redirect_after_login');
        window.location.href = redirectTo;
        
      } catch (error) {
        console.error('Error handling callback:', error);
        setError(error instanceof Error ? error.message : 'Failed to handle callback');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    setAuthState: (updates: Partial<AuthState>) => {
      if (updates.user !== undefined) safeSetUser(updates.user);
      if (updates.tokens !== undefined) setTokens(updates.tokens);
      if (updates.isAuthenticated !== undefined) setIsAuthenticated(updates.isAuthenticated);
      if (updates.isLoading !== undefined) setIsLoading(updates.isLoading);
      if (updates.error !== undefined) setError(updates.error);
    }
  };
  
  // Create the context value
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    tokens,
    isLoading,
    error,
    login,
    logout,
    handleCallback: async (callbackUrl: string) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams(new URL(callbackUrl).search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        const savedState = oauthStorage.getState();
        const codeVerifier = oauthStorage.getCodeVerifier();
        
        if (error) {
          throw new Error(`Authorization failed: ${error}`);
        }
        
        if (!code || !state || state !== savedState) {
          throw new Error('Invalid authorization response');
        }
        
        if (!codeVerifier) {
          throw new Error('Missing code verifier');
        }
        
        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code, codeVerifier);
        oauthStorage.setTokens(tokens);
        
        // Get user info
        const config = getRuntimeConfig();
        const userInfo = await getUserInfo(config.userInfoEndpoint, tokens.access_token);
        const user: User = { ...userInfo, sub: userInfo.sub || 'anonymous' };
        oauthStorage.setUserInfo(user);
        
        // Update state
        setTokens(tokens);
        safeSetUser(user);
        setIsAuthenticated(true);
        
        // Redirect to the originally requested page or home
        const redirectTo = sessionStorage.getItem('redirect_after_login') || '/';
        sessionStorage.removeItem('redirect_after_login');
        window.location.href = redirectTo;
        
      } catch (error) {
        console.error('Error handling callback:', error);
        setError(error instanceof Error ? error.message : 'Failed to handle callback');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    setAuthState: (updates: Partial<AuthState>) => {
      if (updates.user !== undefined) safeSetUser(updates.user);
      if (updates.tokens !== undefined) setTokens(updates.tokens);
      if (updates.isAuthenticated !== undefined) setIsAuthenticated(updates.isAuthenticated);
      if (updates.isLoading !== undefined) setIsLoading(updates.isLoading);
      if (updates.error !== undefined) setError(updates.error);
    }
  };
  
  // Return the provider with the context value
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
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
