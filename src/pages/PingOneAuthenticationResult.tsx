import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { RESULT_STORAGE_KEY, type PlaygroundResult, RESPONSE_TYPES } from './PingOneAuthentication';
import TokenDisplay from '../components/TokenDisplay';

const Page = styled.div<{ $celebrate?: boolean }>`
  min-height: 100vh;
  padding: 3rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${({ $celebrate }) =>
    $celebrate
      ? 'radial-gradient(circle at top left, rgba(134, 239, 172, 0.85) 0%, transparent 55%), linear-gradient(135deg, rgba(14, 116, 144, 0.75), rgba(21, 128, 61, 0.9))'
      : 'radial-gradient(circle at top left, #fde68a 0%, transparent 55%), rgba(15, 23, 42, 0.95)'};
  color: #f8fafc;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: background 0.6s ease;
`;

const Layout = styled.div`
  max-width: 1120px;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2.25rem;
  align-items: flex-start;
`;

const Card = styled.section<{ $tone?: 'primary' | 'secondary' | 'comedy' }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  border-radius: 22px;
  padding: 2.25rem;
  box-shadow: 0 30px 70px -35px rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: ${({ $tone }) => {
    switch ($tone) {
      case 'primary':
        return 'linear-gradient(150deg, rgba(15,23,42,0.95) 0%, rgba(30,64,175,0.9) 55%, rgba(59,130,246,0.75) 100%)';
      case 'comedy':
        return 'linear-gradient(150deg, rgba(236,72,153,0.9) 0%, rgba(219,39,119,0.85) 60%, rgba(236,72,153,0.75) 100%)';
      default:
        return 'linear-gradient(150deg, rgba(15,23,42,0.9) 0%, rgba(30,58,138,0.85) 70%, rgba(14,116,144,0.65) 100%)';
    }
  }};
  color: rgba(241, 245, 249, 0.95);
  backdrop-filter: blur(14px);
`;

const Title = styled.h1`
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
  text-align: center;
  line-height: 1.1;
`;

const Subtitle = styled.p`
  max-width: 720px;
  margin: 0 auto 2.5rem;
  text-align: center;
  color: rgba(226, 232, 240, 0.85);
  font-size: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(191, 219, 254, 0.95);
`;

const DataList = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 1.25rem 1.5rem;
  padding-top: 0.75rem;
`;

const DataTerm = styled.dt`
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.75);
`;

const DataValue = styled.dd`
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: rgba(241, 245, 249, 0.95);
  overflow-wrap: anywhere;
`;

const EmptyTokenNotice = styled.div`
  border-radius: 16px;
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.18);
  border: 1px dashed rgba(191, 219, 254, 0.45);
  color: rgba(15, 23, 42, 0.85);
  font-size: 0.9rem;
  line-height: 1.6;
  backdrop-filter: blur(6px);
`;

const ButtonRow = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  border-radius: 16px;
  padding: 0.85rem 1.35rem;
  border: 1px solid ${({ $variant }) =>
    $variant === 'secondary' ? 'rgba(148, 163, 184, 0.35)' : 'transparent'};
  background: ${({ $variant }) =>
    $variant === 'secondary'
      ? 'rgba(15, 23, 42, 0.55)'
      : 'linear-gradient(135deg, rgba(13, 148, 136, 0.95), rgba(59, 130, 246, 0.95))'};
  color: #f8fafc;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $variant }) =>
      $variant === 'secondary'
        ? '0 15px 30px -20px rgba(71, 85, 105, 0.7)'
        : '0 25px 45px -18px rgba(56, 189, 248, 0.6)'};
  }
`;

const EmptyState = styled.div`
  margin-top: 3rem;
  padding: 2rem;
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px dashed rgba(148, 163, 184, 0.35);
  text-align: center;
  color: rgba(226, 232, 240, 0.85);
  line-height: 1.6;
`;

const PingOneAuthenticationResult: React.FC = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RESULT_STORAGE_KEY);
      if (stored) {
        setResult(JSON.parse(stored) as PlaygroundResult);
      }
    } catch (error) {
      console.warn('[PingOneAuthenticationResult] Failed to load result:', error);
    }
  }, []);

  const responseTypeLabel = useMemo(() => {
    if (!result) return '';
    const found = RESPONSE_TYPES.find(type => type.value === result.responseType);
    return found ? found.label : result.responseType;
  }, [result]);

  const handleStartOver = () => {
    setIsRestarting(true);
    setTimeout(() => {
      navigate('/pingone-authentication');
    }, 200);
  };

  const handleClear = () => {
    setIsClearing(true);
    localStorage.removeItem(RESULT_STORAGE_KEY);
    setResult(null);
    setTimeout(() => {
      setIsClearing(false);
    }, 200);
  };

  const tokensForDisplay = useMemo(() => {
    if (!result) {
      return null;
    }
    const combined = { ...result.tokens } as Record<string, unknown>;
    if (!combined.scope && result.config.scopes) {
      combined.scope = result.config.scopes;
    }
    return combined;
  }, [result]);

  if (!result) {
    return (
      <Page $celebrate={false}>
        <Title>PingOne Tokens Lounge</Title>
        <Subtitle>
          The portal is quiet. Run a redirect or redirectless login to populate this space with freshly minted tokens.
        </Subtitle>
        <EmptyState>
          <p>No recent login artifacts detected.</p>
          <ButtonRow>
            <ActionButton onClick={handleStartOver}>Return to Playground</ActionButton>
          </ButtonRow>
        </EmptyState>
      </Page>
    );
  }

  return (
    <Page>
      <Title>PingOne Tokens Lounge</Title>
      <Subtitle>
        Welcome back, token wrangler. Here's what your latest {result.mode === 'redirectless' ? 'redirectless' : 'redirect'}
        {' '}adventure produced.
      </Subtitle>

      <Layout>
        <Card $tone="primary">
          <SectionTitle>Session Summary</SectionTitle>
          <DataList>
            <div>
              <DataTerm>Mode</DataTerm>
              <DataValue>{result.mode === 'redirectless' ? 'Redirectless (pi.flow)' : 'Redirect (Hosted UI)'}</DataValue>
            </div>
            <div>
              <DataTerm>Response Type</DataTerm>
              <DataValue>{responseTypeLabel}</DataValue>
            </div>
            <div>
              <DataTerm>Generated</DataTerm>
              <DataValue>{new Date(result.timestamp).toLocaleString()}</DataValue>
            </div>
            <div>
              <DataTerm>Client Id</DataTerm>
              <DataValue>{result.config.clientId}</DataValue>
            </div>
            <div>
              <DataTerm>Scopes</DataTerm>
              <DataValue>{result.config.scopes || 'openid'}</DataValue>
            </div>
            <div>
              <DataTerm>Auth URL</DataTerm>
              <DataValue style={{ fontSize: '0.78rem', lineHeight: 1.4 }}>{result.authUrl}</DataValue>
            </div>
          </DataList>
        </Card>

        <Card>
          <SectionTitle>Tokens</SectionTitle>
          {Object.keys(result.tokens).length === 0 ? (
            <EmptyTokenNotice>
              No tokens were generated for the selected response type. Try choosing a response type that includes
              <code> token </code> or <code> id_token </code> and re-run the flow.
            </EmptyTokenNotice>
          ) : (
            <TokenDisplay tokens={tokensForDisplay as Record<string, unknown> & {
              access_token?: string;
              id_token?: string;
              token_type?: string;
              expires_in?: number;
              refresh_token?: string;
              scope?: string;
            }} />
          )}
        </Card>

        <Card $tone="comedy">
          <SectionTitle>Context Clues</SectionTitle>
          <EmptyTokenNotice style={{ background: 'rgba(254, 240, 138, 0.25)', border: '1px dashed rgba(250, 204, 21, 0.65)' }}>
            Make sure the client secret you entered belongs to a PingOne application that supports redirectless logins.
            Run the flow again at any time, then use the Token Management button on each token card to dive deeper.
          </EmptyTokenNotice>
        </Card>
      </Layout>

      <ButtonRow>
        <ActionButton onClick={handleStartOver} disabled={isRestarting}>
          {isRestarting ? 'Starting…' : 'Start Over'}
        </ActionButton>
        <ActionButton $variant="secondary" onClick={handleClear} disabled={isClearing}>
          {isClearing ? 'Clearing…' : 'Clear Tokens'}
        </ActionButton>
      </ButtonRow>
    </Page>
  );
};

export default PingOneAuthenticationResult;
