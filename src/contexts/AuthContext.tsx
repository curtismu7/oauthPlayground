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
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
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

        const tokens = oauthStorage.getTokens();
        console.log('🔍 [AuthContext] Retrieved tokens from storage:', !!tokens);
        clientLog(`[AuthContext] Retrieved tokens from storage: ${!!tokens}`);

        if (tokens?.access_token) {
          console.log('🔍 [AuthContext] Validating stored token...');
          clientLog('[AuthContext] Validating stored token...');

          // Check if token is still valid (not expired)
          const now = Date.now();
          const expiresAt = tokens.expires_at;

          console.log('🔍 [AuthContext] Token validation:', {
            currentTime: now,
            expiresAt: expiresAt,
            isExpired: expiresAt ? now >= expiresAt : 'no expiry set'
          });

          if (expiresAt && now >= expiresAt) {
            console.log('⚠️ [AuthContext] Token has expired, clearing storage');
            clientLog('[AuthContext] Token has expired, clearing storage');
            oauthStorage.clearTokens();
            oauthStorage.clearAll();
            setUser(null);
            setIsAuthenticated(false);
          } else {
            console.log('✅ [AuthContext] Token is valid, setting authenticated state');
            clientLog('[AuthContext] Token is valid, setting authenticated state');

            setIsAuthenticated(true);

            // Try to get user info if available
            try {
              // Use runtime-configured UserInfo endpoint (computed from env/client config)
              const cfg = getRuntimeConfig();
              console.log('🔍 [AuthContext] Using UserInfo endpoint from runtime config:', cfg.userInfoEndpoint);
              const userInfo = await getUserInfo(cfg.userInfoEndpoint, tokens.access_token);
              setUser({
                id: userInfo.sub,
                email: userInfo.email || '',
                name: userInfo.name || '',
                given_name: userInfo.given_name || '',
                family_name: userInfo.family_name || '',
                picture: userInfo.picture || ''
              });
              console.log('✅ [AuthContext] User info retrieved successfully');
              clientLog('[AuthContext] User info retrieved successfully');
            } catch (error) {
              console.warn('⚠️ [AuthContext] Could not fetch user info:', error);
              clientLog('[AuthContext] Could not fetch user info');
              // Set basic user info from stored data
              setUser({ authenticated: true });
            }
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
        setAuthInitialized(true);
        console.log('✅ [AuthContext] Authentication initialization complete');
        clientLog('[AuthContext] Authentication initialization complete');
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

      // Function to colorize URL with alternating colors after $ and &
      const colorizeUrl = (url: string): string => {
        // Split URL by $ and & characters while preserving them
        const parts = url.split(/([\$&])/);
        let result = '';
        let colorIndex = 0;
        const colors = ['#0070CC', '#2563eb', '#7c3aed', '#dc2626', '#16a34a', '#ca8a04'];

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (part === '$' || part === '&') {
            // Color the separator differently
            result += `<span style="color: #ef4444; font-weight: bold;">${part}</span>`;
            colorIndex = (colorIndex + 1) % colors.length;
          } else {
            // Color the text after separators
            result += `<span style="color: ${colors[colorIndex]};">${part}</span>`;
          }
        }

        return result;
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
        padding: 1.5rem;
        border-radius: 12px;
        max-width: 650px;
        max-height: 70vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      `;

      // State for URL editing
      let isEditingUrl = false;
      let editedUrl = authUrl;

      modalContent.innerHTML = `
        <h2 style="margin-top: 0; margin-bottom: 0.75rem; color: #0070CC; font-size: 1.25rem;">🔍 Authorization Request Debug</h2>
        <p style="color: #666; margin-bottom: 1rem; font-size: 0.9rem;">Review the parameters being sent to PingOne:</p>
        <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 6px; font-family: 'Monaco', 'Menlo', monospace; font-size: 0.8rem; line-height: 1.3; margin-bottom: 1rem;">
          <div style="margin-bottom: 0.25rem;"><strong>Client ID:</strong> ${debugParams.client_id}</div>
          <div style="margin-bottom: 0.25rem;"><strong>Redirect URI:</strong> ${debugParams.redirect_uri}</div>
          <div style="margin-bottom: 0.25rem;"><strong>Response Type:</strong> ${debugParams.response_type}</div>
          <div style="margin-bottom: 0.25rem;"><strong>Scope:</strong> ${debugParams.scope}</div>
          <div style="margin-bottom: 0.25rem;"><strong>State:</strong> ${debugParams.state}</div>
          <div style="margin-bottom: 0.25rem;"><strong>PKCE:</strong> S256, verifier <span style="color: ${codeVerifier ? '#166534' : '#991b1b'}; font-weight: 700;">${codeVerifier ? 'present' : 'missing'}</span></div>
          <div style="margin-bottom: 0.25rem;"><strong>Code Challenge:</strong> ${debugParams.code_challenge.substring(0, 20)}...</div>
          <div style="margin-bottom: 0;"><strong>Code Challenge Method:</strong> ${debugParams.code_challenge_method}</div>
        </div>
        <div style="margin: 1rem 0; padding: 0.75rem; background: #e3f2fd; border-radius: 6px; font-size: 0.85rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <strong style="font-size: 0.9rem;">Full Authorization URL:</strong>
            <div style="display: flex; gap: 0.5rem;">
              <button id="copy-url-btn" style="
                background: #0070CC;
                color: white;
                border: none;
                padding: 0.25rem 0.5rem;
                border-radius: 3px;
                cursor: pointer;
                font-size: 0.7rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.2rem;
              ">
                📋 Copy URL
              </button>
              <button id="edit-url-btn" style="
                background: #0070CC;
                color: white;
                border: none;
                padding: 0.25rem 0.5rem;
                border-radius: 3px;
                cursor: pointer;
                font-size: 0.7rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.2rem;
              ">
                ✏️ Edit URL
              </button>
            </div>
          </div>
          <div id="url-container" style="word-break: break-all; font-family: 'Monaco', 'Menlo', monospace; margin-top: 0.25rem; font-size: 0.75rem;">${colorizeUrl(debugParams.authorization_url)}</div>
        </div>
        <div style="text-align: right; margin-top: 1rem;">
          <button id="debug-continue" style="
            background: #0070CC;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.85rem;
          ">Continue to PingOne</button>
          <button id="debug-cancel" style="
            background: #6c757d;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.85rem;
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
        const editBtn = modalContent.querySelector('#edit-url-btn') as HTMLButtonElement;
        const copyBtn = modalContent.querySelector('#copy-url-btn') as HTMLButtonElement;
        const urlContainer = modalContent.querySelector('#url-container') as HTMLDivElement;

        const toggleEditMode = () => {
          isEditingUrl = !isEditingUrl;

          if (isEditingUrl) {
            // Switch to edit mode
            editBtn.innerHTML = '💾 Save URL';
            editBtn.style.background = '#16a34a';
            copyBtn.style.display = 'none'; // Hide copy button in edit mode

            urlContainer.innerHTML = `
              <textarea id="url-input" style="
                width: 100%;
                min-height: 80px;
                padding: 0.5rem;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 0.8rem;
                line-height: 1.4;
                resize: vertical;
              ">${editedUrl}</textarea>
            `;
          } else {
            // Switch to display mode
            const urlInput = modalContent.querySelector('#url-input') as HTMLTextAreaElement;
            if (urlInput) {
              editedUrl = urlInput.value;
            }

            editBtn.innerHTML = '✏️ Edit URL';
            editBtn.style.background = '#0070CC';
            copyBtn.style.display = 'inline-flex'; // Show copy button in display mode

            urlContainer.innerHTML = colorizeUrl(editedUrl);
          }
        };

        editBtn.onclick = () => {
          toggleEditMode();
        };

        copyBtn.onclick = async () => {
          try {
            const urlToCopy = isEditingUrl ? editedUrl : authUrl;
            await navigator.clipboard.writeText(urlToCopy);
            
            // Visual feedback
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✅ Copied!';
            copyBtn.style.background = '#16a34a';
            
            setTimeout(() => {
              copyBtn.innerHTML = originalText;
              copyBtn.style.background = '#0070CC';
            }, 2000);
          } catch (error) {
            console.error('Failed to copy URL:', error);
            // Fallback for browsers that don't support clipboard API
            const urlToCopy = isEditingUrl ? editedUrl : authUrl;
            const textArea = document.createElement('textarea');
            textArea.value = urlToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✅ Copied!';
            copyBtn.style.background = '#16a34a';
            
            setTimeout(() => {
              copyBtn.innerHTML = originalText;
              copyBtn.style.background = '#0070CC';
            }, 2000);
          }
        };

        continueBtn.onclick = () => {
          document.body.removeChild(debugModal);
          // Use edited URL if it exists, otherwise use original URL
          const finalUrl = isEditingUrl ? editedUrl : authUrl;
          window.location.href = finalUrl;
          resolve({ success: true });
        };

        cancelBtn.onclick = () => {
          document.body.removeChild(debugModal);
          setIsLoading(false);
          reject(new Error('User cancelled login, please login when ready'));
        };
      });

    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      throw error;
    }
  };
  const handleCallback = async (callbackUrl: string): Promise<void> => {
    console.log('🔍 [AuthContext] Handling OAuth callback...');
    console.log('🔍 [AuthContext] Callback URL:', callbackUrl);
    
    try {
      setIsLoading(true);

      const params = parseUrlParams(callbackUrl);
      console.log('🔍 [AuthContext] Parsed callback parameters:', params);
      
      const { code, state, error, error_description } = params;
      console.log('🔍 [AuthContext] Extracted parameters:', {
        hasCode: !!code,
        hasState: !!state,
        hasError: !!error,
        error_description: error_description
      });

      // Check for OAuth errors
      if (error) {
        console.error('❌ [AuthContext] OAuth error received:', error, error_description);
        let userFriendlyMessage = 'Login failed. Please check your credentials and try again.';
        let errorType = 'error';
        
        // Provide more specific messages for common errors
        if (error === 'access_denied') {
          userFriendlyMessage = 'Login was cancelled or denied. Please try again when ready.';
          errorType = 'warning';
        } else if (error === 'invalid_request') {
          userFriendlyMessage = 'Invalid login request. Please check your configuration.';
        } else if (error === 'unauthorized_client') {
          userFriendlyMessage = 'Application is not authorized. Please check your PingOne configuration.';
        } else if (error === 'unsupported_response_type') {
          userFriendlyMessage = 'Unsupported response type. Please contact support.';
        }
        
        throw new Error(userFriendlyMessage);
      }

      if (!code) {
        console.error('❌ [AuthContext] No authorization code received in callback');
        throw new Error('No authorization code received. Please try logging in again.');
      }

      // Verify state parameter for CSRF protection
      const storedState = oauthStorage.getState();
      console.log('🔍 [AuthContext] State verification:', {
        receivedState: state,
        storedState: storedState,
        stateMatch: storedState && state === storedState
      });
      
      if (!storedState || state !== storedState) {
        console.error('❌ [AuthContext] State verification failed');
        console.error('   Expected:', storedState);
        console.error('   Received:', state);
        throw new Error('Security verification failed. Please try logging in again.');
      }

      // Exchange authorization code for tokens
      console.log('🔍 [AuthContext] Getting runtime configuration...');
      const cfg = getRuntimeConfig();
      console.log('🔍 [AuthContext] Runtime config:', {
        environmentId: cfg.environmentId,
        hasClientId: !!cfg.clientId,
        hasClientSecret: !!cfg.clientSecret,
        tokenEndpoint: cfg.tokenEndpoint
      });
      
      const storedCodeVerifier = oauthStorage.getCodeVerifier();
      console.log('🔍 [AuthContext] Code verifier:', {
        hasCodeVerifier: !!storedCodeVerifier,
        codeVerifierLength: storedCodeVerifier?.length
      });
      
      if (!storedCodeVerifier) {
        console.error('❌ [AuthContext] Missing PKCE code_verifier in session');
        throw new Error('Security verification failed. Please try logging in again.');
      }
      
      // Log token exchange (do not include code or client_secret)
      await clientLog(`TOKEN POST ${cfg.tokenEndpoint} grant_type=authorization_code redirect_uri=${encodeURIComponent(cfg.redirectUri)}`);
      console.log('🔍 [AuthContext] Exchanging code for tokens...');

      const tokenResponse = await exchangeCodeForTokens({
        tokenEndpoint: cfg.tokenEndpoint,
        clientId: cfg.clientId,
        clientSecret: cfg.clientSecret,
        redirectUri: cfg.redirectUri,
        code,
        codeVerifier: storedCodeVerifier
      });

      console.log('✅ [AuthContext] Token exchange successful:', {
        hasAccessToken: !!tokenResponse.access_token,
        hasRefreshToken: !!tokenResponse.refresh_token,
        hasIdToken: !!tokenResponse.id_token,
        tokenType: tokenResponse.token_type,
        expiresIn: tokenResponse.expires_in
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
      console.log('✅ [AuthContext] Tokens stored successfully');

      // Validate ID token if present
      let displayName: string | undefined;
      if (tokenResponse.id_token) {
        console.log('🔍 [AuthContext] Validating ID token...');
        await clientLog(`ID_TOKEN validate iss=${cfg.apiUrl}/${cfg.environmentId} aud=${cfg.clientId}`);
        const idTokenClaims = await validateIdToken(
          tokenResponse.id_token,
          cfg.clientId,
          `${cfg.apiUrl}/${cfg.environmentId}`
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
        displayName = idTokenClaims.name || idTokenClaims.email || idTokenClaims.sub;
        console.log('✅ [AuthContext] User info set from ID token:', {
          userId: idTokenClaims.sub,
          hasEmail: !!idTokenClaims.email
        });
      } else {
        console.log('⚠️ [AuthContext] No ID token received, fetching user info from endpoint...');
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
          displayName = userInfo.name || userInfo.email || userInfo.sub;
          console.log('✅ [AuthContext] User info fetched from endpoint');
        } catch (error) {
          console.warn('⚠️ [AuthContext] Could not fetch user info:', error);
          setUser({ authenticated: true });
        }
      }

      setIsAuthenticated(true);
      console.log('✅ [AuthContext] Authentication successful, storing tokens for session persistence');
      
      // Store tokens for session persistence (don't clear them!)
      oauthStorage.setTokens(tokenResponse);
      
      // Only clear temporary OAuth state (not tokens)
      oauthStorage.clearState();
      oauthStorage.clearNonce();
      oauthStorage.clearCodeVerifier();

      // Navigate to dashboard or intended page with success message
      console.log('🔄 [AuthContext] Navigating to dashboard...');
      const successMessage = `Success: You are logged into PingOne as ${displayName || 'authenticated user'}.`;
      navigate('/dashboard', { 
        replace: true,
        state: {
          message: successMessage,
          type: 'success'
        }
      });

    } catch (error) {
      console.error('❌ [AuthContext] Callback handling failed:', error);
      oauthStorage.clearTokens();
      oauthStorage.clearAll();
      setUser(null);
      setIsAuthenticated(false);
      
      // Provide user-friendly error message based on error type
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      let errorType = 'error';
      
      if (error instanceof Error) {
        const errorText = error.message;
        if (errorText.includes('cancelled') || errorText.includes('denied')) {
          errorMessage = 'User cancelled login, please login when ready';
          errorType = 'info';
        } else if (errorText.includes('expired') || errorText.includes('invalid')) {
          errorMessage = 'Your login session has expired. Please try logging in again.';
          errorType = 'warning';
        } else if (errorText.includes('configuration') || errorText.includes('authorized')) {
          errorMessage = 'Configuration issue detected. Please check your PingOne settings.';
          errorType = 'warning';
        } else if (errorText.includes('Security verification failed')) {
          errorMessage = 'Security check failed. Please clear your browser cache and try again.';
          errorType = 'warning';
        }
      }
      
      navigate('/login', { 
        replace: true, 
        state: { 
          message: errorMessage,
          type: errorType
        }
      });
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
      navigate('/login', { 
        replace: true, 
        state: { 
          message: 'You have been logged out successfully.',
          type: 'success'
        }
      });
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
