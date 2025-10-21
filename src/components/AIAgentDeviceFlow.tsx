// src/components/AIAgentDeviceFlow.tsx
// AI Agent Style Device Authorization Flow Interface

import React from 'react';
import { FiCopy, FiExternalLink, FiRefreshCw, FiXCircle, FiCheckCircle, FiAlertTriangle, FiCpu, FiZap, FiActivity } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import JSONHighlighter from './JSONHighlighter';

// AI Assistant Main Container - Modern AI Interface Design
const AIAgentContainer = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  color: #1e293b;
  
  /* AI Assistant branding */
  &::before {
    content: 'AI Assistant';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6366f1;
    letter-spacing: 0.5px;
    z-index: 2;
  }
  
  /* Modern AI interface styling */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 1rem;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%);
    pointer-events: none;
  }
`;

// AI Assistant Header - Modern Chat Interface
const AIHeader = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  color: #475569;
  font-weight: 500;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 0.875rem;
  letter-spacing: 0.5px;
`;

const AITitle = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 0.25rem;
  letter-spacing: -0.01em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const AISubtitle = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 400;
  letter-spacing: 0;
`;

// Neural Network Indicators
const NeuralIndicators = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const NeuralNode = styled.div<{ $active: boolean; $color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${props => props.$active ? props.$color : '#374151'};
  box-shadow: ${props => props.$active ? `0 0 20px ${props.$color}` : 'none'};
  animation: ${props => props.$active ? 'neuralPulse 2s infinite' : 'none'};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.$active ? '#ffffff' : 'transparent'};
    animation: ${props => props.$active ? 'innerPulse 1.5s infinite' : 'none'};
  }
  
  @keyframes neuralPulse {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.7; 
      transform: scale(1.1);
    }
  }
  
  @keyframes innerPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

// AI Chat Display Screen - Modern AI Interface
const AIDisplayScreen = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.05),
    0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ScreenLabel = styled.div`
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const UserCodeDisplay = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #6366f1;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', 'Courier New', monospace;
  font-size: 2rem;
  font-weight: 600;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  border: 1px solid #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

// AI Chat QR Code Section
const QRCodeSection = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
  text-align: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const QRCodeLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

// AI Chat Action Buttons
const AIControlPanel = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const AIControlButton = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'danger' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return '#6366f1';
      case 'secondary': return '#f8fafc';
      case 'success': return '#10b981';
      case 'danger': return '#ef4444';
      default: return '#f8fafc';
    }
  }};
  color: ${props => props.$variant === 'secondary' ? '#64748b' : 'white'};
  border: 1px solid ${props => {
    switch (props.$variant) {
      case 'primary': return '#6366f1';
      case 'secondary': return '#e2e8f0';
      case 'success': return '#10b981';
      case 'danger': return '#ef4444';
      default: return '#e2e8f0';
    }
  }};
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// Status Display
const StatusDisplay = styled.div<{ $status: string }>`
  background: ${props => {
    switch (props.$status) {
      case 'pending': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'authorized': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      case 'denied': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'expired': return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
      default: return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  }};
  border: 2px solid ${props => {
    switch (props.$status) {
      case 'pending': return '#d97706';
      case 'authorized': return '#059669';
      case 'denied': return '#dc2626';
      case 'expired': return '#4b5563';
      default: return '#4b5563';
    }
  }};
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const StatusIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const StatusText = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusMessage = styled.div`
  font-size: 0.875rem;
  color: #ffffff;
`;

// AI Base
const AIBase = styled.div`
  background: linear-gradient(135deg, #312e81 0%, #1e1b4b 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #8b5cf6;
`;

interface AIAgentDeviceFlowProps {
  state: DeviceFlowState;
  onStateUpdate: (newState: DeviceFlowState) => void;
  onComplete: (tokens: any) => void;
  onError: (error: string) => void;
}

const AIAgentDeviceFlow: React.FC<AIAgentDeviceFlowProps> = ({
  state,
  onStateUpdate,
  onComplete,
  onError,
}) => {
  const handleCopyUserCode = () => {
    navigator.clipboard.writeText(state.userCode);
    logger.info('AIAgentDeviceFlow', 'User code copied to clipboard');
  };

  const handleCopyVerificationUri = () => {
    navigator.clipboard.writeText(state.verificationUri);
    logger.info('AIAgentDeviceFlow', 'Verification URI copied to clipboard');
  };

  const handleOpenVerificationUri = () => {
    window.open(state.verificationUriComplete, '_blank');
    logger.info('AIAgentDeviceFlow', 'Verification URI opened in new tab');
  };

  const getStatusIcon = () => {
    switch (state.status) {
      case 'pending':
        return <FiAlertTriangle />;
      case 'authorized':
        return <FiCheckCircle />;
      case 'denied':
        return <FiXCircle />;
      case 'expired':
        return <FiAlertTriangle />;
      default:
        return <FiAlertTriangle />;
    }
  };

  const getStatusText = () => {
    switch (state.status) {
      case 'pending':
        return 'AGENT AUTHENTICATION';
      case 'authorized':
        return 'AGENT AUTHORIZED';
      case 'denied':
        return 'AUTHORIZATION DENIED';
      case 'expired':
        return 'SESSION EXPIRED';
      default:
        return 'UNKNOWN STATUS';
    }
  };

  const getStatusMessage = () => {
    return deviceFlowService.getStatusMessage(state);
  };

  return (
    <AIAgentContainer>
      {/* AI Header */}
      <AIHeader>
        <AITitle>
          <FiActivity style={{ marginRight: '0.5rem' }} />
          AI Agent Console
        </AITitle>
        <AISubtitle>Autonomous AI Agent Authorization System</AISubtitle>
      </AIHeader>

      {/* Neural Network Indicators */}
      <NeuralIndicators>
        <NeuralNode $active={state.status === 'pending'} $color="#f59e0b" />
        <NeuralNode $active={state.status === 'authorized'} $color="#10b981" />
        <NeuralNode $active={state.status === 'denied'} $color="#ef4444" />
        <NeuralNode $active={state.status === 'expired'} $color="#6b7280" />
      </NeuralIndicators>

      {/* AI Display Screen */}
      <AIDisplayScreen>
        <ScreenLabel>Authorization Token</ScreenLabel>
        <UserCodeDisplay>
          {deviceFlowService.formatUserCode(state.userCode)}
        </UserCodeDisplay>
      </AIDisplayScreen>

      {/* QR Code Section */}
      <QRCodeSection>
        <QRCodeLabel>
          <FiCpu style={{ marginRight: '0.5rem' }} />
          Neural Network Scanner
        </QRCodeLabel>
        <QRCodeContainer>
          <QRCodeSVG
            value={state.verificationUriComplete}
            size={180}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
            includeMargin={true}
          />
        </QRCodeContainer>
      </QRCodeSection>

      {/* AI Control Panel */}
      <AIControlPanel>
        <AIControlButton $variant="secondary" onClick={handleCopyUserCode}>
          <FiCopy /> Copy Token
        </AIControlButton>
        <AIControlButton $variant="secondary" onClick={handleCopyVerificationUri}>
          <FiCopy /> Copy URI
        </AIControlButton>
        <AIControlButton $variant="primary" onClick={handleOpenVerificationUri}>
          <FiExternalLink /> Authorize
        </AIControlButton>
      </AIControlPanel>

      {/* Status Display */}
      <StatusDisplay $status={state.status}>
        <StatusIcon>{getStatusIcon()}</StatusIcon>
        <StatusText>{getStatusText()}</StatusText>
        <StatusMessage>{getStatusMessage()}</StatusMessage>
      </StatusDisplay>

      {/* Success Display - Realistic AI Assistant Interface */}
      {state.status === 'authorized' && state.tokens && (
        <div style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
          border: '3px solid #f97316', 
          borderRadius: '1rem', 
          padding: '2rem',
          marginTop: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          color: 'white'
        }}>
          {/* AI Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid #374151'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.25rem'
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
                  Claude AI Assistant
                </div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  Advanced AI • Online & Ready
                </div>
              </div>
            </div>
            <div style={{
              background: '#10b981',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              Active
            </div>
          </div>

          {/* Chat Interface */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #374151',
            height: '300px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #374151'
            }}>
              <div style={{ fontSize: '1.25rem' }}>💬</div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Conversation</h3>
            </div>
            
            {/* Chat Messages */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  flexShrink: 0
                }}>
                  👤
                </div>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#e2e8f0',
                  maxWidth: '80%'
                }}>
                  Can you help me analyze the quarterly sales data?
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                justifyContent: 'flex-end'
              }}>
                <div style={{
                  background: 'rgba(249, 115, 22, 0.2)',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#e2e8f0',
                  maxWidth: '80%'
                }}>
                  I'd be happy to help analyze your quarterly sales data. I can process the information and provide insights on trends, performance metrics, and recommendations.
                </div>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  flexShrink: 0
                }}>
                  🤖
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  flexShrink: 0
                }}>
                  👤
                </div>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#e2e8f0',
                  maxWidth: '80%'
                }}>
                  Great! I'll upload the CSV file now.
                </div>
              </div>
            </div>
            
            {/* Typing Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.75rem',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.5rem'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem'
              }}>
                🤖
              </div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                Claude is analyzing your data...
              </div>
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                marginLeft: 'auto'
              }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '4px',
                      height: '4px',
                      background: '#f97316',
                      borderRadius: '50%',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: `${i * 0.2}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* AI Capabilities */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: '1px solid #374151'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontSize: '1.25rem' }}>📊</div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Data Analysis</h3>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                CSV, JSON, Excel processing
              </div>
              <div style={{
                background: '#10b981',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                display: 'inline-block'
              }}>
                Active
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1rem',
              borderRadius: '0.75rem',
              border: '1px solid #374151'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontSize: '1.25rem' }}>🔍</div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Research</h3>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Web search & fact checking
              </div>
              <div style={{
                background: '#3b82f6',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                display: 'inline-block'
              }}>
                Ready
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            <button style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <FiMessageCircle /> Chat
            </button>
            <button style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <FiUpload /> Upload
            </button>
            <button style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <FiSettings /> Settings
            </button>
          </div>
        </div>
      )}

      {/* AI Base */}
      <AIBase />
    </AIAgentContainer>
  );
};

export default AIAgentDeviceFlow;
