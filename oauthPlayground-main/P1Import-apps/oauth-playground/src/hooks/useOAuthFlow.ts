import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateRandomString, sha256 } from '../utils/crypto';

const useOAuthFlow = (flowType = 'authorization_code') => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    tokens: null,
    userInfo: null,
    flowState: {
      codeVerifier: '',
      state: '',
      nonce: '',
    },
  });

  // PingOne configuration - these should come from environment variables in production
  const config = {
    authEndpoint: 'https://auth.pingone.com/{{environmentId}}/as/authorize',
    tokenEndpoint: 'https://auth.pingone.com/{{environmentId}}/as/token',
    userInfoEndpoint: 'https://auth.pingone.com/{{environmentId}}/as/userinfo',
    clientId: 'YOUR_CLIENT_ID',
    redirectUri: window.location.origin + '/callback',
    scopes: ['openid', 'profile', 'email'],
  };

  // Generate PKCE code verifier and challenge
  const generatePkceCodes = useCallback(async () => {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hashed)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return { codeVerifier, codeChallenge };
  }, []);

  // Initialize the OAuth flow
  const initFlow = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const state = generateRandomString(32);
      const nonce = generateRandomString(32);
      
      let authUrl = new URL(config.authEndpoint);
      const params = new URLSearchParams({
        response_type: flowType === 'authorization_code' ? 'code' : 'token',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: config.scopes.join(' '),
        state,
        nonce,
      });
      
      // Add PKCE for authorization code flow
      if (flowType === 'authorization_code' || flowType === 'pkce') {
        const { codeVerifier, codeChallenge } = await generatePkceCodes();
        params.append('code_challenge', codeChallenge);
        params.append('code_challenge_method', 'S256');
        
        setState(prev => ({
          ...prev,
          flowState: {
            ...prev.flowState,
            codeVerifier,
            state,
            nonce,
          },
        }));
      } else {
        setState(prev => ({
          ...prev,
          flowState: {
            ...prev.flowState,
            state,
            nonce,
          },
        }));
      }
      
      authUrl.search = params.toString();
      return authUrl.toString();
      
    } catch (error) {
      console.error('Error initializing OAuth flow:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to initialize OAuth flow',
        isLoading: false,
      }));
      return null;
    }
  }, [flowType, config, generatePkceCodes]);

  // Handle OAuth callback
  const handleCallback = useCallback(async (url) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const params = new URLSearchParams(url.split('?')[1]);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');
      
      // Check for errors
      if (error) {
        throw new Error(params.get('error_description') || 'Authorization failed');
      }
      
      // Verify state
      if (state !== state.flowState.state) {
        throw new Error('Invalid state parameter');
      }
      
      // Handle implicit flow (token in URL fragment)
      if (flowType === 'implicit') {
        const hashParams = new URLSearchParams(url.split('#')[1]);
        const accessToken = hashParams.get('access_token');
        const idToken = hashParams.get('id_token');
        
        if (!accessToken) {
          throw new Error('No access token found in response');
        }
        
        // Store tokens
        const tokens = { access_token: accessToken, id_token: idToken };
        localStorage.setItem('oauth_tokens', JSON.stringify(tokens));
        
        // Fetch user info
        const userInfo = await fetchUserInfo(accessToken);
        
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          tokens,
          userInfo,
        }));
        
        return { success: true, tokens, userInfo };
      }
      
      // Handle authorization code flow
      if (flowType === 'authorization_code' || flowType === 'pkce') {
        if (!code) {
          throw new Error('No authorization code found in response');
        }
        
        // Exchange code for tokens
        const tokenResponse = await fetch(config.tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            code,
            ...(flowType === 'pkce' && {
              code_verifier: state.flowState.codeVerifier,
            }),
          }),
        });
        
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          throw new Error(errorData.error_description || 'Failed to exchange code for tokens');
        }
        
        const tokens = await tokenResponse.json();
        localStorage.setItem('oauth_tokens', JSON.stringify(tokens));
        
        // Fetch user info
        const userInfo = await fetchUserInfo(tokens.access_token);
        
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          tokens,
          userInfo,
        }));
        
        return { success: true, tokens, userInfo };
      }
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Authentication failed',
        isLoading: false,
      }));
      return { success: false, error: error.message };
    }
  }, [flowType, config, state.flowState]);

  // Fetch user info from UserInfo endpoint
  const fetchUserInfo = async (accessToken) => {
    const response = await fetch(config.userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    return await response.json();
  };

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('oauth_tokens');
    setState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokens: null,
      userInfo: null,
      flowState: {
        codeVerifier: '',
        state: '',
        nonce: '',
      },
    });
  }, []);

  return {
    ...state,
    initFlow,
    handleCallback,
    logout,
  };
};

export default useOAuthFlow;
