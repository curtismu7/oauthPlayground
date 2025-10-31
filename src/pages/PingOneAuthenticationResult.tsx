import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { RESULT_STORAGE_KEY, type PlaygroundResult, RESPONSE_TYPES } from './PingOneAuthentication';
import { UnifiedTokenDisplay } from '../services/unifiedTokenDisplayService';
import LoginSuccessModal from '../components/LoginSuccessModal';
import { FiChevronLeft, FiPackage } from 'react-icons/fi';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import V7StepperService from '../services/v7StepperService';

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

const FlowItem = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  background: #ffffff;
`;

const FlowLabel = styled.div`
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
`;

const FlowMono = styled.pre`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.8rem;
  overflow-x: auto;
  margin: 0 0 0.5rem 0;
`;

const ContextCard = styled.div`
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 12px;
  padding: 2rem;
`;

const TopNav = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1rem;
`;

const PrevButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f3f4f6;
  color: #374151;
  cursor: pointer;
  font-weight: 600;
  &:hover { background: #e5e7eb; }
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
  const [flowLogCollapsed, setFlowLogCollapsed] = useState(true);
  const [flowLog, setFlowLog] = useState<any[] | null>(null);

  // V7 Stepper components
  const {
    StepContainer,
    StepHeader,
    StepHeaderLeft,
    StepHeaderRight,
    VersionBadge,
    StepHeaderTitle,
    StepHeaderSubtitle,
    StepContent,
    StepNavigation,
    NavigationButton
  } = V7StepperService.createStepLayout({ theme: 'blue', showProgress: false });

  // Small brand logo (same shield mark used in the login popup)
  const BrandLogo: React.FC<{ size?: number }> = ({ size = 28 }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: 8, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', marginRight: 10 }}>
      <svg width={Math.round(size * 0.75)} height={Math.round(size * 0.75)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2l7 3v5c0 5.25-3.5 9.75-7 11-3.5-1.25-7-5.75-7-11V5l7-3z" fill="#E31837"/>
        <path d="M12 5l4 1.7V10.5c0 3.2-2.1 6.1-4 7-1.9-.9-4-3.8-4-7V6.7L12 5z" fill="#ffffff"/>
      </svg>
    </span>
  );

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
      const savedFlowLog = localStorage.getItem('pingone_login_flow_log');
      if (savedFlowLog) {
        try { setFlowLog(JSON.parse(savedFlowLog)); } catch { setFlowLog(null); }
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
    if (!result) return 'oauth';
    if (result.mode === 'redirectless') return 'redirectless';
    const scopes = (result.config.scopes || '').toLowerCase();
    const hasIdToken = !!result.tokens?.id_token;
    const isOidc = hasIdToken || scopes.split(/\s+/).includes('openid');
    return isOidc ? 'oidc' : 'oauth';
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
      <StepContainer>
        <StepHeader>
          <StepHeaderLeft>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <BrandLogo />
              <StepHeaderTitle>PingOne Tokens Lounge</StepHeaderTitle>
            </div>
            <StepHeaderSubtitle>
              Latest {result.mode === 'redirectless' ? 'redirectless' : 'redirect'} run summary and tokens
            </StepHeaderSubtitle>
          </StepHeaderLeft>
          <StepHeaderRight>
            <VersionBadge>V7</VersionBadge>
          </StepHeaderRight>
        </StepHeader>
        <StepContent>
          <TopNav>
            <PrevButton onClick={() => navigate('/pingone-authentication')}>
              <FiChevronLeft size={16} /> Previous
            </PrevButton>
          </TopNav>
          <Title style={{ display: 'none' }}>Hidden</Title>
          <Subtitle style={{ display: 'none' }}>Hidden</Subtitle>

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

      <CollapsibleHeader
        title="Flow Requests & Responses (latest session)"
        subtitle="Detailed requests and responses for the latest run"
        icon={<FiPackage />}
        defaultCollapsed={true}
        theme="highlight"
        onToggle={(c) => setFlowLogCollapsed(c)}
      >
            {Array.isArray(flowLog) && flowLog.length > 0 ? (
              flowLog.map((item, idx) => (
                <FlowItem key={idx}>
                  <FlowLabel>Step {item.step ?? idx + 1}: {item.title || item.url}</FlowLabel>
                  {item.method && <div style={{ marginBottom: '0.25rem', color: '#6b7280' }}>Method: {item.method}</div>}
                  {item.url && (
                    <>
                      <div style={{ color: '#6b7280' }}>URL:</div>
                      <FlowMono>{item.url}</FlowMono>
                    </>
                  )}
                  {item.params && (
                    <>
                      <div style={{ color: '#6b7280' }}>Params:</div>
                      <FlowMono>{JSON.stringify(item.params, null, 2)}</FlowMono>
                    </>
                  )}
                  {item.requestBody && (
                    <>
                      <div style={{ color: '#6b7280' }}>Request Body:</div>
                      <FlowMono>{JSON.stringify(item.requestBody, null, 2)}</FlowMono>
                    </>
                  )}
                  {item.response && (
                    <>
                      <div style={{ color: '#6b7280' }}>Response:</div>
                      <FlowMono>{JSON.stringify(item.response, null, 2)}</FlowMono>
                    </>
                  )}
                  {item.fullResponse && (
                    <>
                      <div style={{ color: '#6b7280' }}>Full Response:</div>
                      <FlowMono>{JSON.stringify(item.fullResponse, null, 2)}</FlowMono>
                    </>
                  )}
                  {typeof item.status !== 'undefined' && (
                    <div style={{ color: '#6b7280' }}>HTTP Status: {item.status}</div>
                  )}
                  {item.note && (
                    <>
                      <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>Note:</div>
                      <FlowMono>{item.note}</FlowMono>
                    </>
                  )}
                </FlowItem>
              ))
            ) : (
              <div style={{ color: '#6b7280' }}>No flow requests were recorded for this session.</div>
            )}
      </CollapsibleHeader>
        </StepContent>
        <StepNavigation>
          <NavigationButton $variant="secondary" onClick={() => navigate('/pingone-authentication')}>
            <FiChevronLeft size={16} /> Previous
          </NavigationButton>
          <div />
        </StepNavigation>
      </StepContainer>

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
