import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  generateRandomString, 
  generateCodeVerifier, 
  generateCodeChallenge, 
  parseUrlParams, 
  buildAuthUrl, 
  exchangeCodeForTokens, 
  validateIdToken, 
  getUserInfo,
  isTokenExpired,
  buildSignoffUrl
} from '../utils/oauth';
import { oauthStorage, sessionStorageService } from '../utils/storage';
import { clientLog } from '../utils/clientLogger';

// Types for OAuth config and context
type ClientAssertionOptions = {
  alg?: string;
  kid?: string;
  x5t?: string;
  privateKeyPem?: string;
  audience?: string;
};

type OAuthConfig = {
  environmentId: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string;
  authEndpoint: string; // may contain {envId}
  tokenEndpoint: string; // may contain {envId}
  userInfoEndpoint: string; // may contain {envId}
  logoutEndpoint?: string; // may contain {envId}
  logoutRedirectUri?: string;
  tokenAuthMethod?: 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt';
  clientAssertion?: ClientAssertionOptions;
};

type Tokens = {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
  issued_at?: number;
  // optional enrichment
  id_token_claims?: Record<string, any>;
};

type OAuthContextValue = {
  config: OAuthConfig | null;
  tokens: Tokens | null;
  userInfo: any;
  error: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  saveConfig: (newConfig: OAuthConfig) => boolean;
  startOAuthFlow: (flowType?: 'authorization_code' | 'implicit', options?: Record<string, any>) => Promise<boolean>;
  handleCallback: (url: string) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => boolean;
};

const OAuthContext = createContext<OAuthContextValue | undefined>(undefined);

export const OAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Load saved configuration from localStorage
  const loadConfig = (): OAuthConfig | null => {
    try {
      const savedConfig = localStorage.getItem('pingone_config');
      return savedConfig ? JSON.parse(savedConfig) : null;
    } catch (error) {
      console.error('Error loading OAuth config:', error);
      return null;
    }
  };
  
  // State for OAuth configuration and tokens
  const [config, setConfig] = useState<OAuthConfig | null>(loadConfig());
  const [tokens, setTokens] = useState<Tokens | null>(() => {
    const savedTokens = localStorage.getItem('oauth_tokens');
    return savedTokens ? JSON.parse(savedTokens) : null;
  });
  const [userInfo, setUserInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Save tokens to localStorage when they change
  useEffect(() => {
    if (tokens) {
      localStorage.setItem('oauth_tokens', JSON.stringify(tokens));
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('oauth_tokens');
      setIsAuthenticated(false);
    }
  }, [tokens]);
  
  // Check if access token is expired (supports opaque tokens)
  const isAccessTokenExpired = useCallback((): boolean => {
    if (!tokens?.access_token) return true;
    // Prefer expires_in + issued_at when available (works for opaque access tokens)
    if (typeof tokens.expires_in === 'number' && typeof tokens.issued_at === 'number') {
      const now = Math.floor(Date.now() / 1000);
      const skew = 30; // seconds of clock skew tolerance
      const expAt = tokens.issued_at + tokens.expires_in;
      return now >= (expAt - skew);
    }
    // Fallback: try JWT exp check if the access token is a JWT
    try {
      return isTokenExpired(tokens.access_token);
    } catch {
      // If we cannot determine, be conservative but avoid immediate logout by treating as valid briefly
      return false;
    }
  }, [tokens]);
  
  // Check if refresh token is expired
  const isRefreshTokenExpired = useCallback((): boolean => {
    if (!tokens?.refresh_token) return true;
    if (!tokens?.expires_in) return false; // If we don't have expires_in, assume it's valid
    
    const now = Math.floor(Date.now() / 1000);
    const tokenIssuedAt = tokens.issued_at || 0;
    const tokenExpiresAt = tokenIssuedAt + tokens.expires_in;
    
    return now > tokenExpiresAt;
  }, [tokens]);
  
  // Save configuration
  const saveConfig = (newConfig: OAuthConfig): boolean => {
    try {
      localStorage.setItem('pingone_config', JSON.stringify(newConfig));
      setConfig(newConfig);
      return true;
    } catch (error) {
      console.error('Error saving OAuth config:', error);
      return false;
    }
  };
  
  // Initialize OAuth flow
  const startOAuthFlow = useCallback(async (
    flowType: 'authorization_code' | 'implicit' = 'authorization_code',
    options: Record<string, any> = {}
  ): Promise<boolean> => {
    if (!config) {
      setError('OAuth configuration is missing. Please configure your PingOne settings first.');
      return false;
    }
    
    try {
      setError(null);
      setIsLoading(true);
      
      const state = generateRandomString();
      const nonce = generateRandomString();
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Save flow state to sessionStorage via shared oauthStorage
      oauthStorage.setState(state);
      oauthStorage.setNonce(nonce);
      oauthStorage.setCodeVerifier(codeVerifier);
      sessionStorageService.setItem('oauth_flow_type', flowType);

      // Debug (no secrets): confirm what's stored before redirect
      try {
        console.debug('[OAuthContext] Prepared PKCE and state', {
          flowType,
          state,
          nonce,
          code_verifier_len: codeVerifier?.length || 0,
          code_challenge_len: codeChallenge?.length || 0,
          storage: 'sessionStorage (oauthStorage)'
        });
      } catch {}
      
      // Build authorization URL
      const authUrl = buildAuthUrl({
        authEndpoint: config.authEndpoint.replace('{envId}', config.environmentId),
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        scope: config.scopes,
        state,
        nonce,
        codeChallenge,
        codeChallengeMethod: 'S256',
        responseType: flowType === 'implicit' ? 'id_token token' : 'code',
        ...options
      });
      
      // Redirect to authorization server
      window.location.href = authUrl;
      return true;
      
    } catch (error: any) {
      console.error('Error starting OAuth flow:', error);
      setError(`Failed to start OAuth flow: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  }, [config]);
  
  // Handle OAuth callback
  const handleCallback = useCallback(async (url: string): Promise<boolean> => {
    if (!config) {
      setError('OAuth configuration is missing. Please configure your PingOne settings first.');
      return false;
    }
    
    try {
      setError(null);
      setIsLoading(true);
      
      const params = parseUrlParams(url);
      console.debug('[OAuthContext] Callback params parsed:', params);
      clientLog('debug', '[OAuthContext] Callback params parsed', { params });
      // Only proceed if this context initiated the flow
      const flowTypeExisting = sessionStorageService.getItem('oauth_flow_type');
      if (!flowTypeExisting) {
        console.debug('[OAuthContext] Skipping callback: no oauth_flow_type found, likely handled by AuthContext');
        clientLog('debug', '[OAuthContext] Skipping callback: no oauth_flow_type found');
        return false;
      }
      // Capture all values BEFORE clearing storage (use sessionStorage-backed helpers)
      const savedState = oauthStorage.getState();
      const savedNonce = oauthStorage.getNonce();
      const savedCodeVerifier = oauthStorage.getCodeVerifier();
      const flowType = flowTypeExisting || 'authorization_code';
      try {
        console.debug('[OAuthContext] Retrieved stored values on callback', {
          flowType,
          has_state: !!savedState,
          has_nonce: !!savedNonce,
          has_code_verifier: !!savedCodeVerifier,
        });
        clientLog('debug', '[OAuthContext] Retrieved stored values on callback', {
          flowType,
          has_state: !!savedState,
          has_nonce: !!savedNonce,
          has_code_verifier: !!savedCodeVerifier,
        });
      } catch {}
      
      // Clean up stored values (after capture)
      oauthStorage.clearState();
      oauthStorage.clearNonce();
      oauthStorage.clearCodeVerifier();
      sessionStorageService.removeItem('oauth_flow_type');
      
      // Check for errors
      if (params.error) {
        throw new Error(params.error_description || `Authorization failed: ${params.error}`);
      }
      
      // For implicit flow, we get tokens directly in the URL fragment
      if (flowType === 'implicit') {
        if (!params.access_token) {
          throw new Error('No access token found in the response');
        }
        
        // Validate ID token if present
        if (params.id_token) {
          try {
            await validateIdToken(
              params.id_token,
              config.clientId,
              `https://auth.pingone.com/${config.environmentId}`
            );
          } catch (error) {
            console.error('ID token validation failed:', error);
            throw new Error('Invalid ID token');
          }
        }
        
        // Store tokens
        const tokens: Tokens = {
          access_token: params.access_token,
          id_token: params.id_token,
          token_type: params.token_type || 'Bearer',
          expires_in: parseInt(params.expires_in) || 3600,
          scope: params.scope,
          issued_at: Math.floor(Date.now() / 1000),
        };
        console.debug('[OAuthContext] Storing tokens from implicit flow');
        setTokens(tokens);
        
        // Fetch user info if the token includes the required scope
        if (params.scope && params.scope.includes('openid')) {
          try {
            const userInfo = await getUserInfo(
              config.userInfoEndpoint.replace('{envId}', config.environmentId),
              params.access_token
            );
            setUserInfo(userInfo);
          } catch (error) {
            console.error('Failed to fetch user info:', error);
          }
        }
        
        setIsLoading(false);
        return true;
      }
      
      // For authorization code flow, exchange the code for tokens
      if (!params.code) {
        throw new Error('No authorization code found in the response');
      }
      
      // Verify state to prevent CSRF
      if (!params.state) {
        console.warn('No state parameter found in callback URL');
        throw new Error('No state parameter found in callback URL');
      }
      if (!savedState) {
        console.warn('No saved state found in localStorage - this may happen with existing sessions');
        // For existing sessions, we might not have saved state, so we'll be more lenient
        // but still log the issue for debugging
        console.log('Callback state:', params.state);
      } else if (params.state !== savedState) {
        console.error('State parameter mismatch:', {
          received: params.state,
          saved: savedState
        });
        throw new Error('Invalid state parameter - possible CSRF attempt or session mismatch');
      }
      
      // Exchange code for tokens
      if (!savedCodeVerifier) {
        console.error('[OAuthContext] Missing code_verifier on callback; check storage alignment and redirect flow');
        clientLog('error', '[OAuthContext] Missing code_verifier on callback');
        // Auth server may require PKCE; surface a clear error
        throw new Error('No value supplied for required parameter: code_verifier');
      }
      console.debug('[OAuthContext] Exchanging code for tokens at:', config.tokenEndpoint.replace('{envId}', config.environmentId));
      clientLog('info', '[OAuthContext] Exchanging code for tokens', {
        endpoint: config.tokenEndpoint.replace('{envId}', config.environmentId),
        auth_method: config.tokenAuthMethod,
      });
      // Normalize client assertion options to util's expected shape
      const alg = config.clientAssertion?.alg;
      const assertionOptionsNorm = config.clientAssertion
        ? {
            ...(config.clientAssertion.audience ? { audience: config.clientAssertion.audience } : {}),
            ...(config.clientAssertion.kid ? { kid: config.clientAssertion.kid } : {}),
            ...(config.clientAssertion.x5t ? { x5t: config.clientAssertion.x5t } : {}),
            ...(config.clientAssertion.privateKeyPem
              ? { privateKeyPEM: config.clientAssertion.privateKeyPem }
              : {}),
            ...((alg && ['RS256', 'ES256', 'ES384', 'PS256'].includes(alg))
              ? { signAlg: alg as 'RS256' | 'ES256' | 'ES384' | 'PS256' }
              : {}),
            ...((alg && ['HS256', 'HS384', 'HS512'].includes(alg))
              ? { hmacAlg: alg as 'HS256' | 'HS384' | 'HS512' }
              : {}),
          }
        : undefined;

      const inferredAuthMethod: 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt' | undefined =
        (config.tokenAuthMethod as any) ?? (config.clientSecret ? 'client_secret_basic' : undefined);

      const tokenRequest = {
        tokenEndpoint: config.tokenEndpoint.replace('{envId}', config.environmentId),
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        code: params.code,
        codeVerifier: savedCodeVerifier,
        ...(inferredAuthMethod ? { authMethod: inferredAuthMethod } : {}),
        ...(assertionOptionsNorm ? { assertionOptions: assertionOptionsNorm } : {}),
        ...(config.clientSecret ? { clientSecret: config.clientSecret } as { clientSecret: string } : {}),
      };
      const tokenResponse = await exchangeCodeForTokens(tokenRequest);
      
      // Validate ID token if present
      if (tokenResponse.id_token) {
        try {
          const idTokenClaims = await validateIdToken(
            tokenResponse.id_token,
            config.clientId,
            `https://auth.pingone.com/${config.environmentId}`
          );
          
          // Verify nonce
          if (idTokenClaims.nonce !== savedNonce) {
            throw new Error('Invalid nonce in ID token');
          }
          
          // Store ID token claims
          tokenResponse.id_token_claims = idTokenClaims;
        } catch (error) {
          console.error('ID token validation failed:', error);
          throw new Error('Invalid ID token');
        }
      }
      
      // Add issued_at timestamp for token expiration calculation
      tokenResponse.issued_at = Math.floor(Date.now() / 1000);
      
      // Store tokens
      setTokens(tokenResponse as Tokens);
      console.debug('[OAuthContext] Tokens stored successfully; notifying subscribers');
      
      // Fetch user info if the token includes the required scope
      if (tokenResponse.scope && tokenResponse.scope.includes('openid')) {
        try {
          const userInfo = await getUserInfo(
            config.userInfoEndpoint.replace('{envId}', config.environmentId),
            tokenResponse.access_token
          );
          setUserInfo(userInfo);
        } catch (error) {
          console.error('Failed to fetch user info:', error);
        }
      }
      
      setIsLoading(false);
      return true;
      
    } catch (error: any) {
      console.error('Error handling OAuth callback:', error);
      setError(error.message || 'Failed to complete OAuth flow');
      setIsLoading(false);
      return false;
    }
  }, [config]);
  
  // Logout
  const logout = useCallback((): void => {
    const currentTokens = tokens; // capture for id_token_hint
    setTokens(null);
    setUserInfo(null);

    // Clear tokens from localStorage
    localStorage.removeItem('oauth_tokens');

    // RP-initiated logout (signoff) if configured
    try {
      const logoutEndpoint = config?.logoutEndpoint?.replace('{envId}', config?.environmentId || '') || '';
      const postLogoutRedirectUri = config?.logoutRedirectUri || window.location.origin;
      const idTokenHint = currentTokens?.id_token;
      if (logoutEndpoint) {
        const baseArgs: { logoutEndpoint: string; postLogoutRedirectUri: string; idTokenHint?: string } = {
          logoutEndpoint,
          postLogoutRedirectUri,
          ...(idTokenHint ? { idTokenHint } : {}),
        };
        const url = buildSignoffUrl(baseArgs);
        window.location.href = url;
        return;
      }
    } catch (e) {
      console.warn('Signoff redirect failed, falling back to local logout', e);
    }

    // Fallback: Redirect to home or login page
    navigate('/');
  }, [navigate, config, tokens]);
  
  // Check if user is authenticated
  const checkAuthStatus = useCallback((): boolean => {
    if (!tokens) return false;
    
    // Check if access token is expired
    if (isAccessTokenExpired()) {
      // If we have a refresh token, try to refresh the access token
      if (tokens.refresh_token && !isRefreshTokenExpired()) {
        // In a real app, you would implement token refresh here
        console.log('Access token expired, attempting to refresh...');
        // For now, we'll just log out the user
        logout();
        return false;
      } else {
        // No valid refresh token, user needs to log in again
        logout();
        return false;
      }
    }
    
    return true;
  }, [tokens, isAccessTokenExpired, isRefreshTokenExpired, logout]);
  
  // Check authentication status on initial load and when tokens change
  useEffect(() => {
    if (tokens) {
      const isAuth = checkAuthStatus();
      setIsAuthenticated(isAuth);
    } else {
      setIsAuthenticated(false);
    }
  }, [tokens, checkAuthStatus]);
  
  // Handle OAuth callback on component mount if we're on the callback URL
  useEffect(() => {
    if (location.pathname === '/callback' && location.search) {
      handleCallback(window.location.href).then(success => {
        if (success) {
          navigate('/dashboard');
        } else {
          navigate('/login', { state: { error: 'Authentication failed' } });
        }
      });
    }
  }, [location, navigate, handleCallback]);
  
  return (
    <OAuthContext.Provider
      value={{
        config,
        tokens,
        userInfo,
        error,
        isLoading,
        isAuthenticated,
        saveConfig,
        startOAuthFlow,
        handleCallback,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </OAuthContext.Provider>
  );
};

// Custom hook to use the OAuth context
export const useOAuth = () => {
  const context = useContext(OAuthContext);
  if (!context) {
    throw new Error('useOAuth must be used within an OAuthProvider');
  }
  return context;
};

export default OAuthContext;
