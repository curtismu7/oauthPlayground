import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { v4ToastManager } from '../utils/v4ToastMessages';
import {
	DEFAULT_CONFIG,
	RESULT_STORAGE_KEY,
	STORAGE_KEY,
	FLOW_CONTEXT_KEY,
	type PlaygroundResult,
} from './PingOneAuthentication';
import { FlowContextService } from '../services/flowContextService';

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  background: radial-gradient(circle at top left, #fde68a 0%, transparent 55%),
    rgba(15, 23, 42, 0.95);
  color: #f8fafc;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const Card = styled.section`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 64, 175, 0.85));
  border-radius: 20px;
  padding: 2rem;
  max-width: 640px;
  width: 100%;
  text-align: center;
  box-shadow: 0 35px 80px -30px rgba(14, 116, 144, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 0.75rem;
`;

const Message = styled.p`
  font-size: 1rem;
  color: rgba(226, 232, 240, 0.85);
  line-height: 1.6;
  margin: 0 auto 1.5rem;
`;

const TokenList = styled.pre`
  background: rgba(15, 23, 42, 0.7);
  border-radius: 16px;
  padding: 1.25rem;
  font-family: 'Fira Code', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.78rem;
  color: rgba(226, 232, 240, 0.9);
  word-break: break-word;
  white-space: pre-wrap;
  border: 1px solid rgba(56, 189, 248, 0.3);
`;

const Button = styled.button`
  margin-top: 1.5rem;
  border-radius: 14px;
  padding: 0.85rem 1.4rem;
  border: none;
  background: linear-gradient(135deg, rgba(13, 148, 136, 0.95), rgba(59, 130, 246, 0.95));
  color: #f8fafc;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 30px 55px -20px rgba(56, 189, 248, 0.75);
  }
`;

type ParsedTokens = Record<string, string>;

const parseParams = (input: string, trimHash = false): ParsedTokens => {
	if (!input) {
		return {};
	}

	const target = trimHash && input.startsWith('#') ? input.slice(1) : input;
	const params = new URLSearchParams(target);
	const result: ParsedTokens = {};

	params.forEach((value, key) => {
		result[key] = value;
	});

	return result;
};

const PingOneAuthenticationCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tokens, setTokens] = useState<ParsedTokens>({});
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Token exchange function for authorization code flow
  const exchangeCodeForTokens = async (code: string, flowContext: any) => {
    console.log('[PingOneAuthenticationCallback] Starting token exchange...');
    
    // Get the stored PKCE code verifier
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
    if (!codeVerifier) {
      throw new Error('PKCE code verifier not found. Please restart the flow.');
    }
    
    const tokenEndpoint = `https://auth.pingone.com/${config.environmentId}/as/token`;
    
    const tokenRequest = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: codeVerifier
    };
    
    console.log('[PingOneAuthenticationCallback] Token request:', {
      tokenEndpoint,
      grant_type: tokenRequest.grant_type,
      client_id: tokenRequest.client_id,
      has_code_verifier: !!tokenRequest.code_verifier,
      redirect_uri: tokenRequest.redirect_uri
    });
    
    const response = await fetch('/api/token-exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenEndpoint,
        ...tokenRequest
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PingOneAuthenticationCallback] Token exchange error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }
    
    const tokenData = await response.json();
    console.log('[PingOneAuthenticationCallback] Token exchange response:', tokenData);
    
    // Clean up PKCE data
    sessionStorage.removeItem('pkce_code_verifier');
    sessionStorage.removeItem('pkce_code_challenge');
    
    return tokenData;
  };

  const config = useMemo(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) } as PlaygroundResult['config'];
      }
    } catch (error) {
      console.warn('[PingOneAuthenticationCallback] Failed to load config:', error);
    }
    return DEFAULT_CONFIG;
  }, []);

  const computeFallbackPath = useCallback((): string => {
    const mergedParams = { ...parseParams(location.hash, true), ...parseParams(location.search.startsWith('?') ? location.search.slice(1) : location.search) };
    if (mergedParams.flow === 'oauth-authorization-code-v7' || location.search.includes('flow=oauth-authorization-code-v7')) {
      return '/flows/oauth-authorization-code-v7?step=4';
    }
    if (mergedParams.flow === 'device-authorization-v7' || location.search.includes('flow=device-authorization-v7')) {
      return '/flows/device-authorization-v7?step=4';
    }
    return '/pingone-authentication/result';
  }, [location.hash, location.search]);

  useEffect(() => {
    const processTokens = async () => {
      const fragmentTokens = parseParams(location.hash, true);
      const queryTokens = parseParams(location.search.startsWith('?') ? location.search.slice(1) : location.search);
      const mergedTokens = { ...queryTokens, ...fragmentTokens };

      const flowContextRaw = sessionStorage.getItem(FLOW_CONTEXT_KEY);
      let flowContext: { returnPath?: string; responseType?: string } | null = null;
      
      console.log('[PingOneAuthenticationCallback] Processing tokens:', {
        fragmentTokens,
        queryTokens,
        mergedTokens,
        hasFlowContext: !!flowContextRaw,
        flowContextRaw,
        locationHash: location.hash,
        locationSearch: location.search
      });
      
      console.log('[PingOneAuthenticationCallback] Flow context lookup:', {
        flowContextRaw,
        hasFlowContext: !!flowContextRaw,
        FLOW_CONTEXT_KEY
      });
      
      if (flowContextRaw) {
        try {
          flowContext = JSON.parse(flowContextRaw);
          console.log('[PingOneAuthenticationCallback] Parsed flow context:', flowContext);
        } catch (err) {
          console.warn('[PingOneAuthenticationCallback] Failed to parse flow context:', err);
        }
      }

      if (!flowContext) {
        const savedContext = FlowContextService.getFlowContext();
        if (savedContext) {
          flowContext = {
            returnPath: savedContext.returnPath,
            responseType: savedContext.flowState?.responseType,
          };
          FlowContextService.clearFlowContext();
        }
      }

      // Check for errors FIRST (before checking if tokens are empty)
      const errorParam = mergedTokens.error;
      const errorDescription = mergedTokens.error_description;
      
      if (errorParam) {
        console.log('[PingOneAuthenticationCallback] Error detected:', { errorParam, errorDescription });
        
        if (errorParam === 'unsupported_response_type') {
          v4ToastManager.showError('Response type not supported by your PingOne application. Try using "code" instead of hybrid flows.');
          setError(`Unsupported response type: ${errorDescription || 'Your PingOne application does not support the selected response type. Please use "code" (Authorization Code) instead.'}`);
        } else if (errorParam === 'invalid_client') {
          v4ToastManager.showError('Invalid client configuration. Check your Client ID and Client Secret.');
          setError(`Client error: ${errorDescription || 'Invalid client credentials or configuration.'}`);
        } else if (errorParam === 'invalid_scope') {
          v4ToastManager.showError('Invalid scope configuration. Check your scopes in PingOne application settings.');
          setError(`Scope error: ${errorDescription || 'The requested scopes are not valid for this application.'}`);
        } else if (errorParam === 'invalid_request') {
          v4ToastManager.showError('Invalid request parameters. Check your configuration.');
          setError(`Request error: ${errorDescription || 'The request parameters are invalid. Please check your configuration.'}`);
        } else {
          v4ToastManager.showError(`Authentication error: ${errorParam}`);
          setError(`Authentication failed: ${errorDescription || errorParam}`);
        }
        
        setIsProcessing(false);
        return;
      }

      if (Object.keys(mergedTokens).length === 0) {
        v4ToastManager.showError('No tokens found on callback. Complete the flow and try again.');
        setError('Missing tokens in callback response.');
        setIsProcessing(false);
        return;
      }

      // Check if we have an authorization code (for authorization code flow)
      if (mergedTokens.code && !mergedTokens.access_token) {
        console.log('[PingOneAuthenticationCallback] Authorization code detected:', {
          code: mergedTokens.code.substring(0, 10) + '...',
          state: mergedTokens.state,
          hasAccessToken: !!mergedTokens.access_token
        });
        
        try {
          console.log('[PingOneAuthenticationCallback] Starting token exchange...');
          const tokenResponse = await exchangeCodeForTokens(mergedTokens.code, flowContext);
          console.log('[PingOneAuthenticationCallback] Token exchange successful:', {
            hasAccessToken: !!tokenResponse.access_token,
            hasIdToken: !!tokenResponse.id_token,
            hasRefreshToken: !!tokenResponse.refresh_token,
            tokenKeys: Object.keys(tokenResponse)
          });
          
          // Merge the exchanged tokens with the original response
          const finalTokens = { ...mergedTokens, ...tokenResponse };
          setTokens(finalTokens);
          
          console.log('[PingOneAuthenticationCallback] Final tokens prepared:', {
            tokenCount: Object.keys(finalTokens).length,
            tokenKeys: Object.keys(finalTokens)
          });
          
          // Update the result with the final tokens
          const result: PlaygroundResult = {
            timestamp: Date.now(),
            mode: 'redirect',
            responseType: flowContext?.responseType || config.responseType,
            tokens: finalTokens,
            config,
            authUrl: window.location.href,
            context: {
              isRedirectless: false,
            },
          };
          
          console.log('[PingOneAuthenticationCallback] Saving result to localStorage:', {
            key: RESULT_STORAGE_KEY,
            hasTokens: !!result.tokens,
            tokenCount: Object.keys(result.tokens).length
          });
          
          localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
          
          // Verify storage
          const storedResult = localStorage.getItem(RESULT_STORAGE_KEY);
          console.log('[PingOneAuthenticationCallback] Verification - stored result:', {
            exists: !!storedResult,
            size: storedResult?.length || 0
          });
          
          sessionStorage.removeItem(FLOW_CONTEXT_KEY);
          
          v4ToastManager.showSuccess('Authorization successful! Tokens received.');
          
          const targetPath = flowContext?.returnPath || '/pingone-authentication/result';
          console.log('[PingOneAuthenticationCallback] Navigating to:', targetPath);
          
          navigate(targetPath);
          return;
          
        } catch (tokenError) {
          console.error('[PingOneAuthenticationCallback] Token exchange failed:', tokenError);
          v4ToastManager.showError('Failed to exchange authorization code for tokens.');
          setError(`Token exchange failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
          setIsProcessing(false);
          return;
        }
      }

      // For implicit flow or other flows that return tokens directly
      setTokens(mergedTokens);

      const result: PlaygroundResult = {
      timestamp: Date.now(),
      mode: 'redirect',
      responseType: flowContext?.responseType || config.responseType,
      tokens: mergedTokens,
      config,
      authUrl: window.location.href,
      context: {
        isRedirectless: false,
      },
    };

    localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
    sessionStorage.removeItem(FLOW_CONTEXT_KEY);

    const popupDetected = window.name === 'PingOneLoginWindow' || (window.opener && window.opener !== window);
    
    console.log('[PingOneAuthenticationCallback] Popup detection:', {
      windowName: window.name,
      hasOpener: !!window.opener,
      openerSameWindow: window.opener === window,
      popupDetected
    });

    if (popupDetected) {
      console.log('[PingOneAuthenticationCallback] Detected popup - sending message to opener');
      try {
        if (window.opener && window.opener !== window) {
          console.log('[PingOneAuthenticationCallback] Sending message to opener:', {
            type: 'PINGONE_PLAYGROUND_RESULT',
            result: result,
            origin: window.location.origin
          });
          
          window.opener.postMessage(
            {
              type: 'PINGONE_PLAYGROUND_RESULT',
              result,
            },
            window.location.origin
          );
          
          console.log('[PingOneAuthenticationCallback] Message sent successfully');
        } else {
          console.log('[PingOneAuthenticationCallback] No valid opener found');
        }
      } catch (error) {
        console.warn('[PingOneAuthenticationCallback] Failed to post result to opener:', error);
      }
      setIsProcessing(false);
      console.log('[PingOneAuthenticationCallback] Closing popup window');
      
      // Add a small delay before closing to ensure message is sent
      setTimeout(() => {
        window.close();
      }, 100);
      return;
    }

    // Fallback: If we're not in a popup but have tokens, try to detect if we should be in a popup
    if (Object.keys(tokens).length > 0 && !popupDetected) {
      console.log('[PingOneAuthenticationCallback] Not in popup but have tokens - checking if we should be');
      
      // Check if there's a parent window that might be expecting this
      if (window.parent && window.parent !== window) {
        console.log('[PingOneAuthenticationCallback] Found parent window - trying to communicate');
        try {
          window.parent.postMessage(
            {
              type: 'PINGONE_PLAYGROUND_RESULT',
              result,
            },
            window.location.origin
          );
          console.log('[PingOneAuthenticationCallback] Message sent to parent window');
        } catch (error) {
          console.warn('[PingOneAuthenticationCallback] Failed to post result to parent:', error);
        }
      }
    }

    v4ToastManager.showSuccess('Tokens captured! Redirecting to the lounge…');

    const targetPath = flowContext?.returnPath || computeFallbackPath();
    console.log('[PingOneAuthenticationCallback] Redirect decision:', {
      hasFlowContext: !!flowContext,
      returnPath: flowContext?.returnPath,
      computedFallback: computeFallbackPath(),
      finalTargetPath: targetPath
    });
    
    setTimeout(() => navigate(targetPath), 900);
    setIsProcessing(false);
    };

    processTokens();
  }, [computeFallbackPath, config, location.hash, location.search, navigate]);

  return (
    <Page>
      <Card>
        <Title>PingOne Callback Portal</Title>
        <Message>
          {isProcessing
            ? 'Processing tokens returned from PingOne…'
            : error
              ? error
              : Object.keys(tokens).length > 0
                ? 'Success! We saved the returned tokens and sent them to the Tokens Lounge.'
                : 'No tokens detected. Make sure your PingOne app is configured with the correct redirect URI.'}
        </Message>
        {Object.keys(tokens).length > 0 && <TokenList>{JSON.stringify(tokens, null, 2)}</TokenList>}
        <Button onClick={() => navigate('/pingone-authentication/result')}>
          View Tokens Lounge
        </Button>
      </Card>
    </Page>
  );
};

export default PingOneAuthenticationCallback;
