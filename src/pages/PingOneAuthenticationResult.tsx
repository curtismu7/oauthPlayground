import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { RESULT_STORAGE_KEY, type PlaygroundResult, RESPONSE_TYPES } from './PingOneAuthentication';
import { UnifiedTokenDisplay } from '../services/unifiedTokenDisplayService';
import LoginSuccessModal from '../components/LoginSuccessModal';

const Page = styled.div`
  background: white;
  min-height: 100vh;
  padding: 2rem;
  margin-left: 320px;
  margin-top: 100px;
  
  @media (max-width: 768px) {
    margin-left: 0;
    margin-top: 80px;
    padding: 1rem;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #333;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const DataList = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const DataTerm = styled.dt`
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DataValue = styled.dd`
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  color: #333;
  word-break: break-all;
`;

const EmptyTokenNotice = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.6;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $variant }) => 
    $variant === 'secondary' 
      ? `
        background: #6c757d;
        color: white;
        &:hover {
          background: #545b62;
        }
      `
      : `
        background: #007bff;
        color: white;
        &:hover {
          background: #0056b3;
        }
      `
  }
  
  &:disabled {
    background: #adb5bd;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TokenCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const ContextCard = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 12px;
  padding: 2rem;
`;

const ContextTitle = styled.h3`
  color: #856404;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const ContextText = styled.p`
  color: #856404;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
`;

const PingOneAuthenticationResult: React.FC = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalShownRef] = useState<{ current: boolean }>({ current: false });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RESULT_STORAGE_KEY);
      if (stored) {
        const parsedResult = JSON.parse(stored) as PlaygroundResult;
        setResult(parsedResult);
        
        // Show success modal on first load if we have tokens
        if (!modalShownRef.current && Object.keys(parsedResult.tokens).length > 0) {
          modalShownRef.current = true;
          setShowSuccessModal(true);
        }
      }
    } catch (error) {
      console.warn('[PingOneAuthenticationResult] Failed to load result:', error);
    }
    
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
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

  const flowType = useMemo<'oauth' | 'oidc' | 'par' | 'rar' | 'redirectless'>(() => {
    if (!result) {
      return 'oauth';
    }
    return result.mode === 'redirectless' ? 'redirectless' : 'oauth';
  }, [result]);

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
      <Page>
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

      <Card>
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
            <DataValue style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{result.authUrl}</DataValue>
          </div>
        </DataList>
      </Card>

      <Layout>
        <TokenCard>
          <SectionTitle>Tokens</SectionTitle>
          {Object.keys(result.tokens).length === 0 ? (
            <EmptyTokenNotice>
              No tokens were generated for the selected response type. Try choosing a response type that includes
              <code> token </code> or <code> id_token </code> and re-run the flow.
            </EmptyTokenNotice>
          ) : (
            <UnifiedTokenDisplay
              tokens={tokensForDisplay}
              flowType={flowType}
              flowKey="pingone-authentication"
            />
          )}
        </TokenCard>
      </Layout>

      <ButtonRow>
        <ActionButton onClick={handleStartOver} disabled={isRestarting}>
          {isRestarting ? 'Starting…' : 'Start Over'}
        </ActionButton>
        <ActionButton $variant="secondary" onClick={handleClear} disabled={isClearing}>
          {isClearing ? 'Clearing…' : 'Clear Tokens'}
        </ActionButton>
      </ButtonRow>

      <LoginSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Login Successful!"
        message="You have been successfully authenticated with PingOne. Your tokens have been received and are displayed below."
        autoCloseDelay={5000}
      />
    </Page>
  );
};

export default PingOneAuthenticationResult;
