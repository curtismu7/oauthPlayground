import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { oauthStorage } from '../utils/storage';
import { pingOneConfig, DEFAULT_SCOPES, PKCE_CONFIG } from '../config/pingone';
import {
  generateRandomString,
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthUrl,
  exchangeCodeForTokens,
  validateIdToken,
  getUserInfo,
  parseUrlParams
} from '../utils/oauth';
import { AuthContextType, User, LoginResult } from '../types/oauth';

// Create the AuthContext with proper typing
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component with proper TypeScript props
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

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
    try {
      const savedConfigRaw = localStorage.getItem('pingone_config');
      const savedCredsRaw = localStorage.getItem('login_credentials');
      const savedConfig = savedConfigRaw ? JSON.parse(savedConfigRaw) : {};
      const savedCreds = savedCredsRaw ? JSON.parse(savedCredsRaw) : {};

      console.log('🔍 Debug: Runtime Config Sources');
      console.log('  - pingone_config:', savedConfig);
      console.log('  - login_credentials:', savedCreds);

      // Prefer explicit config from Configuration page; fall back to credentials from Login page
      const envId = savedConfig.environmentId || savedCreds.environmentId || pingOneConfig.environmentId;
      const apiUrl = pingOneConfig.apiUrl || 'https://auth.pingone.com';
      const baseUrl = `${apiUrl}/${envId}`;
      const authBase = `${baseUrl}/as`;

      // Map differences in key names (authEndpoint vs authorizationEndpoint)
      const authorizationEndpoint = savedConfig.authEndpoint || `${authBase}/authorize`;
      const tokenEndpoint = savedConfig.tokenEndpoint || `${authBase}/token`;
      const userInfoEndpoint = savedConfig.userInfoEndpoint || `${authBase}/userinfo`;
      const logoutEndpoint = `${authBase}/signoff`;

      const config = {
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

      console.log('✅ Debug: Final Config Used:', config);
      return config;
    } catch (e) {
      console.warn('Failed to load runtime config, using defaults.', e);
      return pingOneConfig;
    }
  };

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const tokens = oauthStorage.getTokens();

        console.log('🔍 Auth Initialization Debug:');
        console.log('  - Tokens found:', !!tokens);
        console.log('  - Access token present:', !!tokens?.access_token);
        console.log('  - Token expiry:', tokens?.expires_at);

        if (tokens?.access_token) {
          // Validate if token is still valid
          if (tokens.expires_at && Date.now() < tokens.expires_at) {
            console.log('✅ Token is valid, setting authenticated');
            setIsAuthenticated(true);

            // Try to get user info if available
            try {
              const userInfo = await getUserInfo(pingOneConfig.userInfoEndpoint, tokens.access_token);
              setUser({
                id: userInfo.sub,
                email: userInfo.email || '',
                name: userInfo.name || '',
                given_name: userInfo.given_name || '',
                family_name: userInfo.family_name || '',
                picture: userInfo.picture || ''
              });
            } catch (error) {
              console.warn('Could not fetch user info:', error);
              // Set basic user info from stored data
              setUser({ authenticated: true });
            }
          } else {
            // Token expired, clear storage
            oauthStorage.clearTokens();
            oauthStorage.clearAll();
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        oauthStorage.clearTokens();
        oauthStorage.clearAll();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Start PingOne OAuth login flow
  const login = async (): Promise<LoginResult> => {
    try {
      setIsLoading(true);

      // Generate OAuth state and PKCE parameters
      const state = generateRandomString(32);
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store OAuth state for CSRF protection
      oauthStorage.setState(state);
      oauthStorage.setCodeVerifier(codeVerifier);

      // Build authorization URL using runtime config
      const cfg = getRuntimeConfig();
      const authUrl = buildAuthUrl({
        authEndpoint: cfg.authorizationEndpoint,
        clientId: cfg.clientId,
        redirectUri: cfg.redirectUri,
        scope: DEFAULT_SCOPES,
        state,
        codeChallenge,
        codeChallengeMethod: PKCE_CONFIG.codeChallengeMethod,
        responseType: 'code'
      });

      // Log outbound authorization request URL (mask state)
      try {
        const u = new URL(authUrl);
        if (u.searchParams.has('state')) {
          u.searchParams.set('state', '***masked***');
        }
        await clientLog(`AUTHORIZATION GET ${u.toString()}`);
      } catch {}

      // Debug: Show authorization request parameters
      const debugParams = {
        client_id: cfg.clientId,
        redirect_uri: cfg.redirectUri,
        response_type: 'code',
        scope: DEFAULT_SCOPES,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: PKCE_CONFIG.codeChallengeMethod,
        authorization_url: authUrl
      };

      // Create debug modal
      const debugModal = document.createElement('div');
      debugModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      `;

      // Function to color-code the authorization URL
      const createColorCodedUrl = (url: string) => {
        const segments = url.split(/[?&]/);
        const baseUrl = segments[0];
        const params = segments.slice(1);

        let coloredHtml = `<span style="color: #2563eb; font-weight: 500;">${baseUrl}</span>`;

        params.forEach((param, index) => {
          const separator = index === 0 ? '?' : '&';
          const colors = ['#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#0891b2', '#be185d'];
          const color = colors[index % colors.length];
          coloredHtml += `<span style="color: #6b7280; font-weight: 400;">${separator}</span><span style="color: ${color}; font-weight: 500;">${param}</span>`;
        });

        return coloredHtml;
      };

      modalContent.innerHTML = `
        <h2 style="margin-top: 0; color: #0070CC; font-size: 1.5rem;">🔍 Authorization Request Debug</h2>
        <p style="color: #666; margin-bottom: 1.5rem;">Review the parameters being sent to PingOne:</p>
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; font-family: 'Monaco', 'Menlo', monospace; font-size: 0.85rem; line-height: 1.4;">
          <div style="margin-bottom: 0.5rem;"><strong>Client ID:</strong> ${debugParams.client_id}</div>
          <div style="margin-bottom: 0.5rem;"><strong>Redirect URI:</strong> ${debugParams.redirect_uri}</div>
          <div style="margin-bottom: 0.5rem;"><strong>Response Type:</strong> ${debugParams.response_type}</div>
          <div style="margin-bottom: 0.5rem;"><strong>Scope:</strong> ${debugParams.scope}</div>
          <div style="margin-bottom: 0.5rem;"><strong>State:</strong> ${debugParams.state}</div>
          <div style="margin-bottom: 0.5rem;"><strong>PKCE:</strong> S256, verifier <span style="color: ${codeVerifier ? '#166534' : '#991b1b'}; font-weight: 700;">${codeVerifier ? 'present' : 'missing'}</span></div>
          <div style="margin-bottom: 0.5rem;"><strong>Code Challenge:</strong> ${debugParams.code_challenge.substring(0, 20)}...</div>
          <div style="margin-bottom: 0.5rem;"><strong>Code Challenge Method:</strong> ${debugParams.code_challenge_method}</div>
        </div>
        <div style="margin: 1.5rem 0; padding: 1rem; background: #e3f2fd; border-radius: 8px; font-size: 0.9rem;">
          <strong>Full Authorization URL:</strong><br>
          <div style="font-family: 'Monaco', 'Menlo', monospace; font-size: 0.85rem; margin-top: 0.5rem; word-break: break-all; line-height: 1.4;">
            ${createColorCodedUrl(debugParams.authorization_url)}
          </div>
        </div>
        <div style="text-align: right; margin-top: 1.5rem;">
          <button id="debug-continue" style="
            background: #0070CC;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
          ">Continue to PingOne</button>
          <button id="debug-cancel" style="
            background: #6c757d;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            margin-left: 0.5rem;
          ">Cancel</button>
        </div>
      `;

      debugModal.appendChild(modalContent);
      document.body.appendChild(debugModal);

      // Handle button clicks
      return new Promise((resolve, reject) => {
        const continueBtn = modalContent.querySelector('#debug-continue') as HTMLButtonElement;
        const cancelBtn = modalContent.querySelector('#debug-cancel') as HTMLButtonElement;

        continueBtn.onclick = () => {
          document.body.removeChild(debugModal);
          // Redirect to PingOne for authentication
          window.location.href = authUrl;
          resolve({ success: true });
        };

        cancelBtn.onclick = () => {
          document.body.removeChild(debugModal);
          setIsLoading(false);
          reject(new Error('Login cancelled by user'));
        };
      });

    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      throw error;
    }
  };

  // Handle OAuth callback and token exchange
  const handleCallback = async (callbackUrl: string): Promise<void> => {
    try {
      setIsLoading(true);

      console.log('🔍 Callback Debug:');
      console.log('  - Callback URL:', callbackUrl);

      const params = parseUrlParams(callbackUrl);
      console.log('  - Parsed params:', params);
      console.log('  - Code present:', !!params.code);
      console.log('  - State present:', !!params.state);

      const { code, state, error, error_description } = params;

      // Check for OAuth errors
      if (error) {
        throw new Error(error_description || error);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Verify state parameter for CSRF protection
      const storedState = oauthStorage.getState();
      console.log('🔍 State Parameter Debug:');
      console.log('  - Received state:', state);
      console.log('  - Stored state:', storedState);
      console.log('  - States match:', state === storedState);

      if (!storedState || state !== storedState) {
        console.error('❌ State parameter mismatch');
        throw new Error('Invalid state parameter');
      }

      // Exchange authorization code for tokens
      const cfg = getRuntimeConfig();
      const storedCodeVerifier = oauthStorage.getCodeVerifier();
      if (!storedCodeVerifier) {
        throw new Error('Missing PKCE code_verifier in session');
      }
      // Log token exchange (do not include code or client_secret)
      await clientLog(`TOKEN POST ${cfg.tokenEndpoint} grant_type=authorization_code redirect_uri=${encodeURIComponent(cfg.redirectUri)}`);

      const tokenResponse = await exchangeCodeForTokens({
        tokenEndpoint: cfg.tokenEndpoint,
        clientId: cfg.clientId,
        clientSecret: cfg.clientSecret,
        redirectUri: cfg.redirectUri,
        code,
        codeVerifier: storedCodeVerifier
      });

      // Store tokens
      const expiresAt = Date.now() + (tokenResponse.expires_in * 1000);
      oauthStorage.setTokens({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        id_token: tokenResponse.id_token,
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
        expires_at: expiresAt
      });

      // Validate ID token if present
      if (tokenResponse.id_token) {
        await clientLog(`ID_TOKEN validate iss=${cfg.apiUrl}/${cfg.environmentId}/as aud=${cfg.clientId}`);
        const idTokenClaims = await validateIdToken(
          tokenResponse.id_token,
          cfg.clientId,
          `${cfg.apiUrl}/${cfg.environmentId}/as`
        );

        // Set user information from ID token
        setUser({
          id: idTokenClaims.sub,
          email: idTokenClaims.email,
          name: idTokenClaims.name,
          given_name: idTokenClaims.given_name,
          family_name: idTokenClaims.family_name,
          picture: idTokenClaims.picture
        });
      } else {
        // Get user info from UserInfo endpoint
        try {
          await clientLog(`USERINFO GET ${cfg.userInfoEndpoint}`);
          const userInfo = await getUserInfo(cfg.userInfoEndpoint, tokenResponse.access_token);
          setUser({
            id: userInfo.sub,
            email: userInfo.email || '',
            name: userInfo.name || '',
            given_name: userInfo.given_name || '',
            family_name: userInfo.family_name || '',
            picture: userInfo.picture || ''
          });
        } catch (error) {
          console.warn('Could not fetch user info:', error);
          setUser({ authenticated: true });
        }
      }

      setIsAuthenticated(true);
      oauthStorage.clearAll();

      // Navigate to dashboard or intended page
      navigate('/dashboard', { replace: true });

    } catch (error) {
      console.error('Callback handling failed:', error);
      oauthStorage.clearTokens();
      oauthStorage.clearAll();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = (): void => {
    try {
      // Clear local storage
      oauthStorage.clearTokens();
      oauthStorage.clearAll();

      // Reset state
      setUser(null);
      setIsAuthenticated(false);

      // Optional: Redirect to PingOne logout
      const logoutUrl = `${pingOneConfig.logoutEndpoint}?post_logout_redirect_uri=${encodeURIComponent(pingOneConfig.logoutRedirectUri)}`;
      window.location.href = logoutUrl;

    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    handleCallback
  };

  return (
    <AuthContext.Provider value={value}>
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
