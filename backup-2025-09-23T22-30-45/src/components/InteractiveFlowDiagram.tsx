import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from './Card';
import { 
  FiUser, 
  FiServer, 
  FiShield, 
  FiCode, 
  FiKey, 
  FiArrowRight, 
  FiArrowDown,
  FiPlay,
  FiPause,
  FiRotateCcw,
  FiInfo,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';

interface FlowStep {
  id: string;
  title: string;
  description: string;
  actor: 'user' | 'client' | 'server' | 'auth-server';
  action: string;
  data?: string;
  duration: number;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface FlowDiagram {
  id: string;
  title: string;
  description: string;
  steps: FlowStep[];
}

const DiagramContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 1rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const FlowSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
`;

const FlowButton = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid ${({ $selected, theme }) => 
    $selected ? theme.colors.primary : theme.colors.gray300};
  border-radius: 0.5rem;
  background-color: ${({ $selected, theme }) => 
    $selected ? `${theme.colors.primary}10` : 'white'};
  color: ${({ $selected, theme }) => 
    $selected ? theme.colors.primary : theme.colors.gray700};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary}10;
  }
`;

const ControlsPanel = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.75rem;
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid ${({ $variant, theme }) => 
    $variant === 'primary' ? theme.colors.primary : theme.colors.gray300};
  border-radius: 0.5rem;
  background-color: ${({ $variant, theme }) => 
    $variant === 'primary' ? theme.colors.primary : 'white'};
  color: ${({ $variant, theme }) => 
    $variant === 'primary' ? 'white' : theme.colors.gray700};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ $variant, theme }) => 
      $variant === 'primary' ? theme.colors.primaryDark : theme.colors.gray100};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DiagramArea = styled.div`
  position: relative;
  min-height: 600px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 1rem;
  padding: 2rem;
  overflow: hidden;
`;

const ActorColumn = styled.div<{ $actor: string }>`
  position: absolute;
  top: 2rem;
  width: 200px;
  height: calc(100% - 4rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  
  ${({ $actor }) => {
    switch ($actor) {
      case 'user':
        return 'left: 2rem;';
      case 'client':
        return 'left: 250px;';
      case 'auth-server':
        return 'right: 250px;';
      case 'server':
        return 'right: 2rem;';
      default:
        return 'left: 2rem;';
    }
  }}
`;

const ActorCard = styled.div<{ $actor: string }>`
  width: 100%;
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-bottom: 1rem;
  
  .actor-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: ${({ $actor, theme }) => {
      switch ($actor) {
        case 'user': return '#3b82f6';
        case 'client': return '#10b981';
        case 'auth-server': return '#f59e0b';
        case 'server': return '#8b5cf6';
        default: return theme.colors.gray500;
      }
    }};
  }
  
  .actor-title {
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.25rem;
  }
  
  .actor-description {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.gray600};
  }
`;

const StepCard = styled.div<{ $status: string; $delay: number }>`
  width: 100%;
  padding: 1rem;
  background-color: white;
  border: 2px solid ${({ $status, theme }) => {
    switch ($status) {
      case 'active': return theme.colors.primary;
      case 'completed': return theme.colors.success;
      case 'error': return theme.colors.error;
      default: return theme.colors.gray200;
    }
  }};
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  opacity: ${({ $status }) => $status === 'pending' ? 0.5 : 1};
  transform: ${({ $status }) => $status === 'active' ? 'scale(1.05)' : 'scale(1)'};
  transition: all 0.3s ease;
  animation-delay: ${({ $delay }) => $delay}ms;
  
  .step-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .step-description {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.gray600};
    line-height: 1.4;
  }
  
  .step-data {
    font-size: 0.7rem;
    color: ${({ theme }) => theme.colors.gray500};
    font-family: 'Monaco', 'Menlo', monospace;
    background-color: ${({ theme }) => theme.colors.gray50};
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    margin-top: 0.5rem;
  }
`;

const Arrow = styled.div<{ $status: string; $delay: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  color: ${({ $status, theme }) => {
    switch ($status) {
      case 'active': return theme.colors.primary;
      case 'completed': return theme.colors.success;
      case 'error': return theme.colors.error;
      default: return theme.colors.gray400;
    }
  }};
  opacity: ${({ $status }) => $status === 'pending' ? 0.3 : 1};
  transition: all 0.3s ease;
  animation-delay: ${({ $delay }) => $delay}ms;
`;

const StatusIndicator = styled.div<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 500;
  
  ${({ $status }) => {
    switch ($status) {
      case 'active':
        return `
          background-color: #dbeafe;
          color: #1e40af;
        `;
      case 'completed':
        return `
          background-color: #dcfce7;
          color: #166534;
        `;
      case 'error':
        return `
          background-color: #fee2e2;
          color: #991b1b;
        `;
      default:
        return `
          background-color: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

const flowDiagrams: FlowDiagram[] = [
  {
    id: 'authorization-code',
    title: 'Authorization Code Flow',
    description: 'The most secure OAuth flow for web applications',
    steps: [
      {
        id: '1',
        title: 'Authorization Request',
        description: 'User clicks login, client redirects to auth server',
        actor: 'user',
        action: 'Clicks login button',
        duration: 1000,
        status: 'pending'
      },
      {
        id: '2',
        title: 'User Authentication',
        description: 'User enters credentials on auth server',
        actor: 'auth-server',
        action: 'Validates user credentials',
        duration: 1500,
        status: 'pending'
      },
      {
        id: '3',
        title: 'Authorization Code',
        description: 'Auth server redirects back with authorization code',
        actor: 'auth-server',
        action: 'Redirects with code',
        data: 'code=abc123&state=xyz',
        duration: 1000,
        status: 'pending'
      },
      {
        id: '4',
        title: 'Token Exchange',
        description: 'Client exchanges code for access token',
        actor: 'client',
        action: 'POST /token with code',
        data: 'grant_type=authorization_code&code=abc123',
        duration: 1500,
        status: 'pending'
      },
      {
        id: '5',
        title: 'Access Token',
        description: 'Auth server returns access token',
        actor: 'auth-server',
        action: 'Returns tokens',
        data: 'access_token=xyz789&refresh_token=def456',
        duration: 1000,
        status: 'pending'
      },
      {
        id: '6',
        title: 'API Access',
        description: 'Client uses access token to call protected API',
        actor: 'client',
        action: 'GET /api/user with token',
        data: 'Authorization: Bearer xyz789',
        duration: 1000,
        status: 'pending'
      }
    ]
  },
  {
    id: 'pkce',
    title: 'PKCE Flow',
    description: 'Authorization Code flow with enhanced security for public clients',
    steps: [
      {
        id: '1',
        title: 'Generate Code Verifier',
        description: 'Client generates cryptographically random code verifier',
        actor: 'client',
        action: 'Generate code_verifier',
        data: 'code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        duration: 1000,
        status: 'pending'
      },
      {
        id: '2',
        title: 'Generate Code Challenge',
        description: 'Client creates SHA256 hash of code verifier',
        actor: 'client',
        action: 'SHA256(code_verifier)',
        data: 'code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        duration: 1000,
        status: 'pending'
      },
      {
        id: '3',
        title: 'Authorization Request',
        description: 'Client redirects to auth server with code challenge',
        actor: 'user',
        action: 'Clicks login with PKCE',
        data: 'code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        duration: 1000,
        status: 'pending'
      },
      {
        id: '4',
        title: 'User Authentication',
        description: 'User authenticates on auth server',
        actor: 'auth-server',
        action: 'Validates credentials',
        duration: 1500,
        status: 'pending'
      },
      {
        id: '5',
        title: 'Authorization Code',
        description: 'Auth server returns authorization code',
        actor: 'auth-server',
        action: 'Redirects with code',
        data: 'code=abc123&state=xyz',
        duration: 1000,
        status: 'pending'
      },
      {
        id: '6',
        title: 'Token Exchange',
        description: 'Client exchanges code + verifier for tokens',
        actor: 'client',
        action: 'POST /token with code + verifier',
        data: 'code=abc123&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        duration: 1500,
        status: 'pending'
      },
      {
        id: '7',
        title: 'Access Token',
        description: 'Auth server validates and returns tokens',
        actor: 'auth-server',
        action: 'Returns access token',
        data: 'access_token=xyz789&refresh_token=def456',
        duration: 1000,
        status: 'pending'
      }
    ]
  },
  {
    id: 'client-credentials',
    title: 'Client Credentials Flow',
    description: 'Machine-to-machine authentication without user interaction',
    steps: [
      {
        id: '1',
        title: 'Token Request',
        description: 'Client requests token using credentials',
        actor: 'client',
        action: 'POST /token with credentials',
        data: 'grant_type=client_credentials&client_id=abc&client_secret=xyz',
        duration: 1000,
        status: 'pending'
      },
      {
        id: '2',
        title: 'Credential Validation',
        description: 'Auth server validates client credentials',
        actor: 'auth-server',
        action: 'Validates client_id and client_secret',
        duration: 1500,
        status: 'pending'
      },
      {
        id: '3',
        title: 'Access Token',
        description: 'Auth server returns access token',
        actor: 'auth-server',
        action: 'Returns access token',
        data: 'access_token=xyz789&token_type=Bearer&expires_in=3600',
        duration: 1000,
        status: 'pending'
      },
      {
        id: '4',
        title: 'API Access',
        description: 'Client uses token to access protected resources',
        actor: 'client',
        action: 'GET /api/data with token',
        data: 'Authorization: Bearer xyz789',
        duration: 1000,
        status: 'pending'
      }
    ]
  }
];

const InteractiveFlowDiagram: React.FC = () => {
  const [selectedFlow, setSelectedFlow] = useState<string>('authorization-code');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<FlowStep[]>([]);

  const currentFlow = flowDiagrams.find(flow => flow.id === selectedFlow);

  useEffect(() => {
    if (currentFlow) {
      setSteps(currentFlow.steps.map(step => ({ ...step, status: 'pending' as const })));
      setCurrentStep(0);
    }
  }, [selectedFlow]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  useEffect(() => {
    setSteps(prev => prev.map((step, index) => ({
      ...step,
      status: index < currentStep ? 'completed' as const :
              index === currentStep ? 'active' as const :
              'pending' as const
    })));
  }, [currentStep]);

  const handlePlay = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));
  };

  const getActorIcon = (actor: string) => {
    switch (actor) {
      case 'user': return <FiUser />;
      case 'client': return <FiCode />;
      case 'auth-server': return <FiShield />;
      case 'server': return <FiServer />;
      default: return <FiUser />;
    }
  };

  const getActorTitle = (actor: string) => {
    switch (actor) {
      case 'user': return 'User';
      case 'client': return 'Client App';
      case 'auth-server': return 'Auth Server';
      case 'server': return 'Resource Server';
      default: return 'Actor';
    }
  };

  const getActorDescription = (actor: string) => {
    switch (actor) {
      case 'user': return 'End user accessing the application';
      case 'client': return 'Your application requesting access';
      case 'auth-server': return 'PingOne authorization server';
      case 'server': return 'API server with protected resources';
      default: return 'Participant in the flow';
    }
  };

  const actors = ['user', 'client', 'auth-server', 'server'];

  return (
    <DiagramContainer>
      <PageHeader>
        <h1>Interactive OAuth Flow Diagrams</h1>
        <p>
          Watch OAuth flows come to life with interactive, step-by-step animations. 
          Select a flow and click play to see how the authentication process works.
        </p>
      </PageHeader>

      <FlowSelector>
        {flowDiagrams.map((flow) => (
          <FlowButton
            key={flow.id}
            $selected={selectedFlow === flow.id}
            onClick={() => setSelectedFlow(flow.id)}
          >
            {getActorIcon(flow.id === 'authorization-code' ? 'client' : 
                         flow.id === 'pkce' ? 'client' : 'client')}
            {flow.title}
          </FlowButton>
        ))}
      </FlowSelector>

      <ControlsPanel>
        <ControlButton
          $variant="primary"
          onClick={handlePlay}
          disabled={isPlaying}
        >
          <FiPlay />
          {currentStep >= steps.length - 1 ? 'Restart' : 'Play'}
        </ControlButton>
        
        <ControlButton onClick={handlePause} disabled={!isPlaying}>
          <FiPause />
          Pause
        </ControlButton>
        
        <ControlButton onClick={handleReset}>
          <FiRotateCcw />
          Reset
        </ControlButton>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          <FiInfo />
          Step {currentStep + 1} of {steps.length}
        </div>
      </ControlsPanel>

      <DiagramArea>
        {actors.map((actor) => (
          <ActorColumn key={actor} $actor={actor}>
            <ActorCard $actor={actor}>
              <div className="actor-icon">{getActorIcon(actor)}</div>
              <div className="actor-title">{getActorTitle(actor)}</div>
              <div className="actor-description">{getActorDescription(actor)}</div>
            </ActorCard>
            
            {steps
              .filter(step => step.actor === actor)
              .map((step, index) => (
                <StepCard
                  key={step.id}
                  $status={step.status}
                  $delay={index * 200}
                >
                  <div className="step-title">
                    {step.status === 'active' && <FiCheckCircle />}
                    {step.status === 'completed' && <FiCheckCircle />}
                    {step.status === 'error' && <FiAlertCircle />}
                    {step.title}
                    <StatusIndicator $status={step.status}>
                      {step.status}
                    </StatusIndicator>
                  </div>
                  <div className="step-description">{step.description}</div>
                  {step.data && (
                    <div className="step-data">{step.data}</div>
                  )}
                </StepCard>
              ))}
          </ActorColumn>
        ))}
        
        {/* Arrows between actors */}
        {steps.map((step, index) => {
          if (step.actor === 'user' || step.actor === 'server') return null;
          
          return (
            <Arrow
              key={`arrow-${step.id}`}
              $status={step.status}
              $delay={index * 200}
            >
              <FiArrowRight />
            </Arrow>
          );
        })}
      </DiagramArea>
    </DiagramContainer>
  );
};

export default InteractiveFlowDiagram;
