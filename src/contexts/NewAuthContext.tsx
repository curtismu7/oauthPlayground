import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { oauthStorage } from '../utils/storage';
import type { OAuthTokens, UserInfo, OAuthTokenResponse } from '../types/storage';
import { AuthContextType, AuthState, LoginResult } from '../types/auth';
import { logger } from '../utils/logger';
import { PingOneErrorInterpreter } from '../utils/pingoneErrorInterpreter';
import { validateAndParseCallbackUrl } from '../utils/urlValidation';
import config from '../services/config';
import { credentialManager } from '../utils/credentialManager';
import { generateCodeChallenge } from '../utils/oauth';

// Define window interface for PingOne environment variables
interface WindowWithPingOne extends Window {
  __PINGONE_ENVIRONMENT_ID__?: string;
  __PINGONE_API_URL__?: string;
  __PINGONE_CLIENT_ID__?: string;
  __PINGONE_CLIENT_SECRET__?: string;
  __PINGONE_REDIRECT_URI__?: string;
}

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
  hasConfigError?: boolean; // Flag to indicate configuration error
  [key: string]: unknown; // Allow additional properties
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
    return tokens ? JSON.parse(JSON.stringify(tokens)) : null;
  } catch (error) {
    logger.error('NewAuthContext', 'Error parsing stored tokens', error);
    return null;
  }
};

const getStoredUser = (): UserInfo | null => {
  try {
    const user = oauthStorage.getUserInfo();
    return user ? JSON.parse(JSON.stringify(user)) : null;
  } catch (error) {
    logger.error('NewAuthContext', 'Error parsing stored user', error);
    return null;
  }
};

  // Function to load configuration from environment variables or localStorage
async function loadConfiguration(): Promise<AppConfig> {
  try {
    console.log('🔧 [NewAuthContext] Loading configuration...');
    
    // Try to get from environment variables first
    const envConfig = {
      disableLogin: false,
      clientId: (window as WindowWithPingOne).__PINGONE_CLIENT_ID__ || '',
      clientSecret: (window as WindowWithPingOne).__PINGONE_CLIENT_SECRET__ || '',
      redirectUri: (window as WindowWithPingOne).__PINGONE_REDIRECT_URI__ || `${window.location.origin}/callback`,
      authorizationEndpoint: '',
      tokenEndpoint: '',
      userInfoEndpoint: '',
      endSessionEndpoint: '',
      scopes: ['openid', 'profile', 'email'],
      environmentId: (window as WindowWithPingOne).__PINGONE_ENVIRONMENT_ID__ || '',
    };

    console.log('🔧 [NewAuthContext] Environment config:', envConfig);

    // If we have environment variables, use them
    if (envConfig.clientId && envConfig.environmentId) {
      console.log('✅ [NewAuthContext] Using environment variables');
      return envConfig;
    }

    // Otherwise, try to get from credential manager
    console.log('🔧 [NewAuthContext] Loading from credential manager...');
    // Try to load from config credentials first, then fall back to authz flow credentials
    let allCredentials = credentialManager.loadConfigCredentials();
    if (!allCredentials.environmentId && !allCredentials.clientId) {
      allCredentials = credentialManager.loadAuthzFlowCredentials();
    }
    console.log('🔧 [NewAuthContext] Credential manager result:', allCredentials);
    
    if (allCredentials.environmentId && allCredentials.clientId) {
      const configFromCredentials = {
        disableLogin: false,
        clientId: allCredentials.clientId,
        clientSecret: allCredentials.clientSecret || '',
        redirectUri: allCredentials.redirectUri || `${window.location.origin}/dashboard-callback`,
        authorizationEndpoint: allCredentials.authEndpoint || '',
        tokenEndpoint: allCredentials.tokenEndpoint || '',
        userInfoEndpoint: allCredentials.userInfoEndpoint || '',
        endSessionEndpoint: allCredentials.endSessionEndpoint || '',
        scopes: allCredentials.scopes || ['openid', 'profile', 'email'],
        environmentId: allCredentials.environmentId,
        hasConfigError: false,
      };
      console.log('✅ [NewAuthContext] Using credentials from credential manager:', configFromCredentials);
      return configFromCredentials;
    }

    // Return default config
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
      environmentId: '',
    };
  } catch (error) {
    logger.error('NewAuthContext', 'Error loading configuration', error);
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
      environmentId: '',
      hasConfigError: true,
    };
  }
}

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
    clientId: string;
    redirectUri: string;
    scope: string;
    state: string;
    nonce: string;
  } | null>(null);

  // Configuration state that updates when localStorage changes
  const [config, setConfig] = useState<AppConfig>(() => {
    // Initialize config on first render with error handling
    try {
      // For now, return default config - async loading will happen in useEffect
      return {
        disableLogin: false,
        clientId: '',
        clientSecret: '',
        redirectUri: `${window.location.origin}/dashboard-callback`,
        authorizationEndpoint: '',
        tokenEndpoint: '',
        userInfoEndpoint: '',
        endSessionEndpoint: '',
        scopes: ['openid', 'profile', 'email'],
        environmentId: '',
        hasConfigError: false,
      };
    } catch (error) {
      logger.error('NewAuthContext', 'Error initializing config', error);
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
        environmentId: '',
        hasConfigError: true,
      };
    }
  });

  // Load configuration asynchronously on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const loadedConfig = await loadConfiguration();
        setConfig(loadedConfig);
        logger.config('NewAuthContext', 'Configuration loaded successfully', loadedConfig);
      } catch (error) {
        logger.error('NewAuthContext', 'Error loading configuration', error);
        setConfig(prev => ({ ...prev, hasConfigError: true }));
      }
    };
    
    loadConfig();
  }, []);

  // Update state helper
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Load tokens from storage on component mount and check configuration
  useEffect(() => {
    const loadTokensFromStorage = () => {
      try {
        const storedTokens = getStoredTokens();
        const storedUser = getStoredUser();
        
        if (storedTokens && isTokenValid(storedTokens)) {
          logger.auth('NewAuthContext', 'Valid tokens found in storage', storedTokens);
          updateState({
            isAuthenticated: true,
            tokens: storedTokens,
            user: storedUser,
            isLoading: false,
            error: null,
          });
        } else if (storedTokens && isRefreshTokenValid(storedTokens)) {
          logger.auth('NewAuthContext', 'Access token expired, but refresh token valid', storedTokens);
          updateState({
            isAuthenticated: false,
            tokens: storedTokens,
            user: storedUser,
            isLoading: false,
            error: 'Access token expired. Please refresh.',
          });
        } else {
          logger.auth('NewAuthContext', 'No valid tokens found in storage');
          updateState({
            isAuthenticated: false,
            tokens: null,
            user: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        logger.error('NewAuthContext', 'Error loading tokens from storage', error);
        updateState({
          isAuthenticated: false,
          tokens: null,
          user: null,
          isLoading: false,
          error: 'Failed to load authentication state',
        });
      }
    };

    loadTokensFromStorage();
  }, [updateState]);

  // Listen for configuration changes
  useEffect(() => {
    const handleConfigChange = async () => {
      try {
        const newConfig = await loadConfiguration();
        setConfig(newConfig);
        logger.config('NewAuthContext', 'Configuration updated', newConfig);
      } catch (error) {
        logger.error('NewAuthContext', 'Error updating configuration', error);
      }
    };

    // Listen for custom config change events
    window.addEventListener('pingone-config-changed', handleConfigChange);
    window.addEventListener('permanent-credentials-changed', handleConfigChange);
    
    // Also listen for storage changes
    window.addEventListener('storage', handleConfigChange);

    return () => {
      window.removeEventListener('pingone-config-changed', handleConfigChange);
      window.removeEventListener('permanent-credentials-changed', handleConfigChange);
      window.removeEventListener('storage', handleConfigChange);
    };
  }, []);

  // Function to refresh configuration
  const refreshConfig = useCallback(async () => {
    logger.config('NewAuthContext', 'Refreshing configuration...');
    try {
      const newConfig = await loadConfiguration();
      setConfig(newConfig);
      logger.config('NewAuthContext', 'Configuration refreshed successfully', newConfig);
    } catch (error) {
      logger.error('NewAuthContext', 'Error refreshing configuration', error);
      setConfig(prev => ({
        ...prev,
        hasConfigError: true,
      }));
    }
  }, []);

  // Listen for localStorage changes and force config refresh
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pingone_config') {
        logger.config('NewAuthContext', 'PingOne config changed in localStorage, refreshing...');
        refreshConfig();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshConfig]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedTokens = getStoredTokens();
        const storedUser = getStoredUser();
        
        if (storedTokens && isTokenValid(storedTokens)) {
          updateState({
            isAuthenticated: true,
            tokens: storedTokens,
            user: storedUser,
            isLoading: false,
            error: null,
          });
        } else {
          updateState({
            isAuthenticated: false,
            tokens: storedTokens,
            user: storedUser,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        logger.error('NewAuthContext', 'Error initializing auth state', error);
        updateState({
          isAuthenticated: false,
          tokens: null,
          user: null,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initializeAuth();
  }, [updateState]);

  // Listen for configuration changes from the Configuration page
  useEffect(() => {
    const handleConfigChange = async () => {
      try {
        const newConfig = await loadConfiguration();
        setConfig(newConfig);
        logger.info('NewAuthContext', 'Configuration updated from localStorage');
      } catch (error) {
        logger.error('NewAuthContext', 'Error reloading configuration', error);
      }
    };

    // Listen for the custom event dispatched when config is saved
    window.addEventListener('pingone-config-changed', handleConfigChange);
    
    return () => {
      window.removeEventListener('pingone-config-changed', handleConfigChange);
    };
  }, []);

  // Login function
  const login = useCallback(async (redirectAfterLogin = '/', callbackType: 'dashboard' | 'oauth' = 'oauth'): Promise<LoginResult> => {
    console.log('🚀 [NewAuthContext] Starting login process...', {
      redirectAfterLogin,
      callbackType,
      hasConfig: !!config,
      clientId: config?.clientId,
      environmentId: config?.environmentId,
      authorizationEndpoint: config?.authorizationEndpoint
    });

    try {
      if (!config?.clientId || !config?.environmentId) {
        const errorMessage = 'Configuration required. Please configure your PingOne settings first.';
        console.error('❌ [NewAuthContext] Missing configuration:', {
          hasClientId: !!config?.clientId,
          hasEnvironmentId: !!config?.environmentId,
          config
        });
        updateState({ error: errorMessage, isLoading: false });
        return { success: false, error: errorMessage };
      }

      console.log('✅ [NewAuthContext] Configuration validated');

      // Generate state and nonce for security
      const state = Math.random().toString(36).substring(2, 15);
      const nonce = Math.random().toString(36).substring(2, 15);
      
      console.log('🔐 [NewAuthContext] Generated security parameters:', {
        state: state.substring(0, 8) + '...',
        nonce: nonce.substring(0, 8) + '...'
      });
      
      // Generate PKCE codes for enhanced security
      const codeVerifier = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      console.log('🔧 [NewAuthContext] PKCE generation successful:', { 
        codeVerifier: codeVerifier.substring(0, 20) + '...', 
        codeChallenge: codeChallenge.substring(0, 20) + '...',
        codeVerifierLength: codeVerifier.length,
        codeChallengeLength: codeChallenge.length
      });
      
      // Store state, nonce, and PKCE codes for validation
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_nonce', nonce);
      sessionStorage.setItem('code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_redirect_after_login', redirectAfterLogin);
      
      console.log('💾 [NewAuthContext] Stored in sessionStorage:', {
        oauth_state: state.substring(0, 8) + '...',
        oauth_nonce: nonce.substring(0, 8) + '...',
        code_verifier: codeVerifier.substring(0, 20) + '...',
        oauth_redirect_after_login: redirectAfterLogin
      });

      // Determine redirect URI based on callback type
      const redirectUri = callbackType === 'dashboard' 
        ? `${window.location.origin}/dashboard-callback`
        : config.redirectUri;

      console.log('🔗 [NewAuthContext] Redirect URI configuration:', {
        callbackType,
        redirectUri,
        windowOrigin: window.location.origin,
        configRedirectUri: config.redirectUri,
        finalRedirectUri: redirectUri
      });

      // Build authorization URL
      const authUrl = new URL(`${config.authorizationEndpoint}`);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', config.clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'openid profile email');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('nonce', nonce);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');

      console.log('🌐 [NewAuthContext] Built authorization URL:', {
        baseUrl: config.authorizationEndpoint,
        fullUrl: authUrl.toString(),
        params: {
          response_type: 'code',
          client_id: config.clientId,
          redirect_uri: redirectUri,
          scope: 'openid profile email',
          state: state.substring(0, 8) + '...',
          nonce: nonce.substring(0, 8) + '...',
          code_challenge: codeChallenge.substring(0, 20) + '...',
          code_challenge_method: 'S256'
        }
      });

      logger.auth('NewAuthContext', 'Prepared authorization URL for modal display', { authUrl: authUrl.toString() });
      
      console.log('🚀 [NewAuthContext] Authorization URL prepared, returning for modal display...');
      
      // Return the URL for modal display instead of direct redirect
      return { success: true, redirectUrl: authUrl.toString() };
    } catch (error) {
      console.error('❌ [NewAuthContext] Login error:', error);
      console.error('❌ [NewAuthContext] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      updateState({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  }, [config, updateState]);

  // Logout function
  const logout = useCallback(() => {
    try {
      logger.auth('NewAuthContext', 'Logging out user');
      
      // Clear tokens and user info from storage
      oauthStorage.clearTokens();
      oauthStorage.clearUserInfo();
      
      // Clear session storage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_nonce');
      sessionStorage.removeItem('oauth_redirect_after_login');
      
      // Update state
      updateState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: null,
      });
      
      logger.auth('NewAuthContext', 'User logged out successfully');
    } catch (error) {
      logger.error('NewAuthContext', 'Error during logout', error);
      updateState({ error: 'Logout failed', isLoading: false });
    }
  }, [updateState]);

  // Handle OAuth callback
  const handleCallback = useCallback(async (url: string): Promise<LoginResult> => {
    try {
      // Validate and parse the callback URL
      const { urlObj, params, code, state, error, errorDescription } = validateAndParseCallbackUrl(url, 'NewAuthContext');
      
      // Check for OAuth error
      if (error) {
        const errorMessage = errorDescription || error;
        logger.error('NewAuthContext', 'OAuth error in callback', { error, errorDescription });
        updateState({ error: errorMessage, isLoading: false });
        return { success: false, error: errorMessage };
      }
      
      // Validate state parameter (more lenient for development)
      const storedState = sessionStorage.getItem('oauth_state');
      console.log('🔍 [NewAuthContext] State validation:', { 
        received: state, 
        stored: storedState, 
        match: state === storedState,
        bothExist: !!(state && storedState)
      });
      
      // Only validate state if both exist - be more lenient for development
      if (state && storedState && state !== storedState) {
        const errorMessage = 'Invalid state parameter. Possible CSRF attack.';
        logger.error('NewAuthContext', 'State validation failed', { received: state, expected: storedState });
        updateState({ error: errorMessage, isLoading: false });
        return { success: false, error: errorMessage };
      }
      
      // If we have a state but no stored state, log a warning but don't fail
      if (state && !storedState) {
        logger.warn('NewAuthContext', 'State received but no stored state found - this may happen if sessionStorage was cleared', { received: state });
      }
      
      // Log state validation for debugging
      if (state && storedState) {
        logger.auth('NewAuthContext', 'State validation successful', { received: state, expected: storedState });
      } else if (state && !storedState) {
        logger.warn('NewAuthContext', 'State received but no stored state found (sessionStorage may have been cleared)', { received: state });
      } else if (!state && storedState) {
        logger.warn('NewAuthContext', 'No state in callback but stored state exists', { expected: storedState });
      }
      
      if (!code) {
        const errorMessage = 'Authorization code not found in callback URL';
        logger.error('NewAuthContext', 'No authorization code in callback', { 
          url, 
          params: Object.fromEntries(params.entries()),
          hasCode: !!code,
          hasState: !!state,
          hasError: !!error
        });
        updateState({ error: errorMessage, isLoading: false });
        return { success: false, error: errorMessage };
      }

      // EARLY GATE: If this callback is for Enhanced Authorization Code Flow V2,
      // do not perform any credential validation or token exchange here.
      try {
        const flowContextRawEarly = sessionStorage.getItem('flowContext');
        if (flowContextRawEarly) {
          const parsedEarly = JSON.parse(flowContextRawEarly);
          const isEnhancedV2Early = parsedEarly?.flow === 'enhanced-authorization-code-v2';
          if (isEnhancedV2Early) {
            // Persist auth code and state for the flow page to handle later
            sessionStorage.setItem('oauth_auth_code', code);
            if (state) sessionStorage.setItem('oauth_state', state);
            const returnPathEarly = parsedEarly?.returnPath || '/flows/enhanced-authorization-code-v2?step=4';
            logger.auth('NewAuthContext', 'Early deferral: Enhanced Auth Code Flow V2 detected; skipping token exchange in context', { returnPath: returnPathEarly });
            return { success: true, redirectUrl: returnPathEarly };
          }
        }
      } catch (e) {
        logger.warn('NewAuthContext', 'Failed to parse flowContext during early gating', e as unknown as string);
      }
      
      // Determine the redirect URI used in the authorization request
      // First check if we have a stored redirect URI from the flow context
      let redirectUri = '';
      const flowContextKey = 'flowContext';
      const flowContext = sessionStorage.getItem(flowContextKey);
      
      if (flowContext) {
        try {
          const parsedContext = JSON.parse(flowContext);
          console.log('🔧 [NewAuthContext] Parsed flow context:', parsedContext);
          if (parsedContext.redirectUri) {
            redirectUri = parsedContext.redirectUri;
            console.log('🔧 [NewAuthContext] Using redirect URI from flow context:', redirectUri);
          } else {
            console.log('⚠️ [NewAuthContext] No redirectUri in flow context');
          }
        } catch (error) {
          console.warn('Failed to parse flow context for redirect URI:', error);
        }
      } else {
        console.log('⚠️ [NewAuthContext] No flow context found in sessionStorage');
      }
      
      // Fallback to determining by callback URL if no flow context
      if (!redirectUri) {
        const isDashboardCallback = url.includes('/dashboard-callback');
        redirectUri = isDashboardCallback 
          ? `${window.location.origin}/dashboard-callback`
          : config?.redirectUri || '';
        console.log('🔧 [NewAuthContext] Using fallback redirect URI:', redirectUri);
      }

      // Get code_verifier from sessionStorage for PKCE
      const codeVerifier = sessionStorage.getItem('code_verifier');
      console.log('🔧 [NewAuthContext] Retrieved code_verifier from sessionStorage:', codeVerifier ? 'present' : 'missing');
      
      // Fallback to credential manager if config is not loaded
      let clientId = config?.clientId || '';
      let clientSecret = config?.clientSecret || '';
      let environmentId = config?.environmentId || '';
      
      if (!clientId || !environmentId) {
        console.log('⚠️ [NewAuthContext] Config not loaded, trying credential manager fallback...');
        try {
          // Import credential manager dynamically to avoid circular dependency
          const { credentialManager } = await import('../utils/credentialManager');
          // Prefer Authorization Code flow credentials; fall back to dashboard/config only if missing
          let credentials = credentialManager.loadAuthzFlowCredentials();
          if (!credentials.environmentId && !credentials.clientId) {
            credentials = credentialManager.loadConfigCredentials();
          }

          clientId = clientId || credentials.clientId || '';
          clientSecret = clientSecret || credentials.clientSecret || '';
          environmentId = environmentId || credentials.environmentId || '';

          console.log('🔧 [NewAuthContext] Fallback credentials loaded (preferring AuthZ):', {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            hasEnvironmentId: !!environmentId
          });
        } catch (error) {
          console.error('❌ [NewAuthContext] Failed to load fallback credentials:', error);
        }
      }
      
      // CRITICAL VALIDATION - Ensure we have valid credentials
      if (!clientId || clientId.trim() === '') {
        console.error('❌ [NewAuthContext] CRITICAL: clientId is empty!', { clientId, environmentId, redirectUri });
        throw new Error('Client ID is required for token exchange. Please configure your OAuth credentials first.');
      }
      
      if (!environmentId || environmentId.trim() === '') {
        console.error('❌ [NewAuthContext] CRITICAL: environmentId is empty!', { clientId, environmentId, redirectUri });
        throw new Error('Environment ID is required for token exchange. Please configure your OAuth credentials first.');
      }
      
      if (!redirectUri || redirectUri.trim() === '') {
        console.error('❌ [NewAuthContext] CRITICAL: redirectUri is empty!', { clientId, environmentId, redirectUri });
        throw new Error('Redirect URI is required for token exchange. Please configure your OAuth credentials first.');
      }

      // If this callback belongs to the Enhanced Authorization Code Flow V2,
      // do NOT auto-exchange here. Defer token exchange to the flow page to avoid double-use of the code.
      try {
        const flowContextRaw = sessionStorage.getItem('flowContext');
        if (flowContextRaw) {
          const parsed = JSON.parse(flowContextRaw);
          const isEnhancedV2 = parsed?.flow === 'enhanced-authorization-code-v2';
          if (isEnhancedV2) {
            // Persist auth code and state for the flow page
            if (code) {
              sessionStorage.setItem('oauth_auth_code', code);
            }
            if (state) {
              sessionStorage.setItem('oauth_state', state);
            }
            const returnPath = parsed?.returnPath || '/flows/enhanced-authorization-code-v2?step=4';
            logger.auth('NewAuthContext', 'Deferring token exchange to Enhanced Auth Code Flow V2 page', { returnPath });
            return { success: true, redirectUrl: returnPath };
          }
        }
      } catch (e) {
        // Non-fatal: if flowContext is malformed, proceed with normal handling
        logger.warn('NewAuthContext', 'Failed to inspect flowContext for enhanced flow gating', e as unknown as string);
      }

      // Exchange code for tokens
      const requestBody = {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri.trim(),
        client_id: clientId.trim(), // Ensure no whitespace
        client_secret: clientSecret || '',
        environment_id: environmentId.trim(), // Ensure no whitespace
        ...(codeVerifier && { code_verifier: codeVerifier })
      };
      
      console.log('🔧 [NewAuthContext] Token exchange request:', requestBody);
      console.log('🔧 [NewAuthContext] Config object:', config);
      console.log('🔧 [NewAuthContext] PingOne config:', config?.pingone);
      console.log('🔧 [NewAuthContext] Request body validation:', {
        hasGrantType: !!requestBody.grant_type,
        hasCode: !!requestBody.code,
        hasRedirectUri: !!requestBody.redirect_uri,
        hasClientId: !!requestBody.client_id,
        hasClientSecret: !!requestBody.client_secret,
        hasEnvironmentId: !!requestBody.environment_id,
        hasCodeVerifier: !!requestBody.code_verifier,
      });
      
      // FINAL VALIDATION - Last chance to catch empty values
      if (requestBody.client_id === '' || !requestBody.client_id) {
        console.error('❌ [NewAuthContext] CRITICAL: Request body has empty client_id!', requestBody);
        throw new Error('CRITICAL ERROR: Request body contains empty client_id. This should never happen.');
      }

      console.log('🌐 [NewAuthContext] Making token exchange request to /api/token-exchange');
      console.log('📤 [NewAuthContext] Request details:', {
        url: '/api/token-exchange',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      });

      const tokenResponse = await fetch('/api/token-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('📥 [NewAuthContext] Token exchange response:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        ok: tokenResponse.ok,
        headers: Object.fromEntries(tokenResponse.headers.entries())
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        const errorMessage = `Token exchange failed: ${errorText}`;
        console.error('❌ [NewAuthContext] Token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          errorText,
          requestBody
        });
        logger.error('NewAuthContext', 'Token exchange failed', { status: tokenResponse.status, error: errorText });
        updateState({ error: errorMessage, isLoading: false });
        return { success: false, error: errorMessage };
      }
      
      const tokenData: OAuthTokenResponse = await tokenResponse.json();
      console.log('✅ [NewAuthContext] Token exchange successful:', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        hasIdToken: !!tokenData.id_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
        tokenData
      });
      
      // Store tokens
      const tokens: OAuthTokens = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        id_token: tokenData.id_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_in: tokenData.expires_in,
        expires_at: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
        refresh_expires_in: tokenData.refresh_expires_in,
        refresh_expires_at: tokenData.refresh_expires_in ? Date.now() + (tokenData.refresh_expires_in * 1000) : undefined,
        scope: tokenData.scope,
      };
      
      console.log('💾 [NewAuthContext] Storing tokens in oauthStorage:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        hasIdToken: !!tokens.id_token,
        tokenType: tokens.token_type,
        expiresIn: tokens.expires_in
      });
      
      oauthStorage.setTokens(tokens);
      
      console.log('✅ [NewAuthContext] Tokens stored successfully');
      
      // Get user info if available
      let userInfo: UserInfo | null = null;
      if (tokenData.access_token && config?.pingone?.userInfoEndpoint) {
        try {
          userInfo = await getUserInfo(config.pingone.userInfoEndpoint, tokenData.access_token);
          oauthStorage.setUserInfo(userInfo);
        } catch (error) {
          logger.warn('NewAuthContext', 'Failed to fetch user info', error);
        }
      }
      
      // Update state
      console.log('🔄 [NewAuthContext] Updating auth state with tokens:', {
        isAuthenticated: true,
        hasTokens: !!tokens,
        hasUser: !!userInfo,
        tokens: tokens ? {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          hasIdToken: !!tokens.id_token
        } : null
      });
      
      updateState({
        isAuthenticated: true,
        tokens: tokens,
        user: userInfo,
        isLoading: false,
        error: null,
      });
      
      // Clear session storage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_nonce');
      
      // Clean up flow context after successful token exchange
      if (flowContext) {
        console.log('🧹 [NewAuthContext] Cleaning up flow context after successful token exchange');
        sessionStorage.removeItem(flowContextKey);
      }
      
      // Get redirect URL
      let redirectUrl = sessionStorage.getItem('oauth_redirect_after_login') || '/';
      sessionStorage.removeItem('oauth_redirect_after_login');
      
      // Check for flow context to continue to next step
      console.log('🔍 [NewAuthContext] Checking flow context:', flowContext);
      console.log('🔍 [NewAuthContext] All sessionStorage keys:', Object.keys(sessionStorage));
      console.log('🔍 [NewAuthContext] All sessionStorage contents:', Object.fromEntries(Object.keys(sessionStorage).map(key => [key, sessionStorage.getItem(key)])));
      
      if (flowContext) {
        try {
          const parsedContext = JSON.parse(flowContext);
          console.log('🔍 [NewAuthContext] Parsed flow context:', parsedContext);
          
          if (parsedContext.returnPath) {
            redirectUrl = parsedContext.returnPath;
            console.log('🔄 [NewAuthContext] Using flow context return path:', redirectUrl);
          } else {
            console.log('⚠️ [NewAuthContext] No returnPath in flow context');
          }
        } catch (error) {
          console.warn('Failed to parse flow context:', error);
        }
      } else {
        console.log('⚠️ [NewAuthContext] No flow context found in sessionStorage');
      }
      
      logger.auth('NewAuthContext', 'Authentication successful', { redirectUrl });
      return { success: true, redirectUrl };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      logger.error('NewAuthContext', 'Error in handleCallback', error);
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
      logger.auth('NewAuthContext', 'Proceeding with OAuth redirect');
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
    logger.auth('NewAuthContext', 'Updating tokens', newTokens);
    setState(prev => ({
      ...prev,
      tokens: newTokens,
      isAuthenticated: !!newTokens?.access_token,
      isLoading: false
    }));
  }, []);

  // Dismiss error function
  const dismissError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Context value
  const contextValue = useMemo(() => {
    // Handle both config structures: config.pingone.* and config.*
    const pingoneConfig = (config?.pingone as any) || (config as any) || {};
    
    // Debug logging for config issues
    if (!config) {
      logger.warn('NewAuthContext', 'Config is undefined', { 
        hasConfig: !!config, 
        configKeys: config ? Object.keys(config) : [],
        configStructure: config 
      });
    }
    
    const value = {
      ...state,
      config: {
        disableLogin: false,
        clientId: pingoneConfig.clientId || '',
        clientSecret: pingoneConfig.clientSecret || '',
        environmentId: pingoneConfig.environmentId || '',
        redirectUri: pingoneConfig.redirectUri || '',
        authorizationEndpoint: pingoneConfig.authEndpoint || pingoneConfig.authorizationEndpoint || '',
        tokenEndpoint: pingoneConfig.tokenEndpoint || '',
        userInfoEndpoint: pingoneConfig.userInfoEndpoint || '',
        endSessionEndpoint: pingoneConfig.logoutEndpoint || pingoneConfig.endSessionEndpoint || '',
        scopes: pingoneConfig.scopes || ['openid', 'profile', 'email'],
        // Also provide the original config structure for backward compatibility
        pingone: {
          clientId: pingoneConfig.clientId || '',
          clientSecret: pingoneConfig.clientSecret || '',
          environmentId: pingoneConfig.environmentId || '',
          redirectUri: pingoneConfig.redirectUri || '',
          authEndpoint: pingoneConfig.authEndpoint || pingoneConfig.authorizationEndpoint || '',
          tokenEndpoint: pingoneConfig.tokenEndpoint || '',
          userInfoEndpoint: pingoneConfig.userInfoEndpoint || '',
          endSessionEndpoint: pingoneConfig.logoutEndpoint || pingoneConfig.endSessionEndpoint || '',
        }
      },
      login,
      logout,
      handleCallback,
      setAuthState,
      showAuthModal,
      authRequestData,
      proceedWithOAuth,
      closeAuthModal,
      updateTokens, // Add the updateTokens function
      dismissError, // Add the dismissError function
    };
    // Reduced debug logging to prevent console spam
    // logger.debug('NewAuthContext', 'Creating context value', value);
    return value;
  }, [state, config, login, logout, handleCallback, setAuthState, showAuthModal, authRequestData, proceedWithOAuth, closeAuthModal, updateTokens, dismissError]);

  // Reduced debug logging to prevent console spam
  // logger.debug('NewAuthContext', 'Rendering AuthProvider with contextValue', contextValue);

  // Add a check to ensure context is properly initialized
  if (!contextValue) {
    logger.error('NewAuthContext', 'Context value is null/undefined, this should not happen');
    return <div>Error: Auth context not properly initialized</div>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  // Reduced debug logging to prevent console spam
  // logger.debug('useAuth', 'Context value', context);
  if (!context) {
    // In development, suppress the error to prevent console spam during HMR
    if (process.env.NODE_ENV === 'development') {
      // Only log once per session to avoid spam
      if (!(window as any).__useAuthErrorLogged) {
        logger.warn('useAuth', 'Context is undefined - likely due to HMR, returning default context');
        (window as any).__useAuthErrorLogged = true;
        // Reset the flag after a delay to allow for recovery
        setTimeout(() => {
          (window as any).__useAuthErrorLogged = false;
        }, 5000);
      }
    } else {
      logger.error('useAuth', 'Context is undefined - not within AuthProvider');
    }
    // Return a default context instead of throwing to prevent app crashes
    return {
      isAuthenticated: false,
      user: null,
      tokens: null,
      isLoading: false,
      error: 'AuthProvider not found',
      config: {
        disableLogin: false,
        clientId: '',
        clientSecret: '',
        redirectUri: '',
        authorizationEndpoint: '',
        tokenEndpoint: '',
        userInfoEndpoint: '',
        endSessionEndpoint: '',
        scopes: [],
        environmentId: '',
        hasConfigError: true,
        pingone: {
          clientId: '',
          clientSecret: '',
          environmentId: '',
          redirectUri: '',
          authEndpoint: '',
          tokenEndpoint: '',
          userInfoEndpoint: '',
          endSessionEndpoint: '',
        }
      },
      login: async () => ({ success: false, error: 'AuthProvider not found' }),
      logout: () => {},
      handleCallback: async () => ({ success: false, error: 'AuthProvider not found' }),
      setAuthState: () => {},
      showAuthModal: false,
      authRequestData: null,
      proceedWithOAuth: () => {},
      closeAuthModal: () => {},
      updateTokens: () => {},
      dismissError: () => {},
    };
  }
  return context;
};

// Helper function to get user info
async function getUserInfo(userInfoEndpoint: string, accessToken: string): Promise<UserInfo> {
  // Use backend proxy to avoid CORS issues
  const backendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://oauth-playground.vercel.app' 
    : 'http://localhost:3001';
  
  // Extract environment ID from userInfoEndpoint
  const environmentId = userInfoEndpoint.match(/\/\/([^\/]+)\/([^\/]+)\/as\/userinfo/)?.[2];
  
  const response = await fetch(`${backendUrl}/api/userinfo?access_token=${accessToken}&environment_id=${environmentId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  return response.json();
}