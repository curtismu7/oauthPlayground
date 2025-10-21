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
    const fragmentTokens = parseParams(location.hash, true);
    const queryTokens = parseParams(location.search.startsWith('?') ? location.search.slice(1) : location.search);
    const mergedTokens = { ...queryTokens, ...fragmentTokens };

    const flowContextRaw = sessionStorage.getItem(FLOW_CONTEXT_KEY);
    let flowContext: { returnPath?: string; responseType?: string } | null = null;
    if (flowContextRaw) {
      try {
        flowContext = JSON.parse(flowContextRaw);
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

    if (Object.keys(mergedTokens).length === 0) {
      v4ToastManager.showError('No tokens found on callback. Complete the flow and try again.');
      setError('Missing tokens in callback response.');
      setIsProcessing(false);
      return;
    }

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

    if (popupDetected) {
      try {
        if (window.opener && window.opener !== window) {
          window.opener.postMessage(
            {
              type: 'PINGONE_PLAYGROUND_RESULT',
              result,
            },
            window.location.origin
          );
        }
      } catch (error) {
        console.warn('[PingOneAuthenticationCallback] Failed to post result to opener:', error);
      }
      setIsProcessing(false);
      window.close();
      return;
    }

    v4ToastManager.showSuccess('Tokens captured! Redirecting to the lounge…');

    const targetPath = flowContext?.returnPath || computeFallbackPath();
    setTimeout(() => navigate(targetPath), 900);
    setIsProcessing(false);
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
