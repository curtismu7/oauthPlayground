// src/components/MCPServerDeviceFlow.tsx
// MCP Server Style Device Authorization Flow Interface

import React from 'react';
import { FiCopy, FiExternalLink, FiRefreshCw, FiXCircle, FiCheckCircle, FiAlertTriangle, FiServer, FiDatabase, FiLink } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import JSONHighlighter from './JSONHighlighter';

// MCP Server Main Container - Server/Infrastructure aesthetics
const MCPServerContainer = styled.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.4),
    0 10px 10px -5px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 2px solid #ec4899;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(236, 72, 153, 0.05) 50%, transparent 70%);
    pointer-events: none;
  }
`;

// Server Header
const ServerHeader = styled.div`
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  border: 2px solid #ec4899;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
`;

const ServerTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #f472b6;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(244, 114, 182, 0.5);
`;

const ServerSubtitle = styled.div`
  font-size: 1rem;
  color: #f9a8d4;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// Server Status Indicators
const ServerIndicators = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ServerIndicator = styled.div<{ $active: boolean; $color: string }>`
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: ${props => props.$active ? props.$color : '#374151'};
  box-shadow: ${props => props.$active ? `0 0 15px ${props.$color}` : 'none'};
  animation: ${props => props.$active ? 'serverBlink 2s infinite' : 'none'};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    border-radius: 1px;
    background: ${props => props.$active ? '#ffffff' : 'transparent'};
    animation: ${props => props.$active ? 'innerBlink 1s infinite' : 'none'};
  }
  
  @keyframes serverBlink {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.6; 
      transform: scale(1.05);
    }
  }
  
  @keyframes innerBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }
`;

// Server Display Screen
const ServerDisplayScreen = styled.div`
  background: linear-gradient(135deg, #000000 0%, #1e293b 100%);
  border: 3px solid #ec4899;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(236, 72, 153, 0.2);
`;

const ScreenLabel = styled.div`
  color: #ec4899;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const UserCodeDisplay = styled.div`
  background: #000000;
  color: #06b6d4;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #06b6d4;
  border: 2px solid #06b6d4;
  box-shadow: 
    inset 0 0 20px rgba(6, 182, 212, 0.2),
    0 0 20px rgba(6, 182, 212, 0.3);
`;

// QR Code Section
const QRCodeSection = styled.div`
  background: #1e293b;
  border: 2px solid #ec4899;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const QRCodeLabel = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #ec4899;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

// Server Control Panel
const ServerControlPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ServerControlButton = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'danger' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return '#ec4899';
      case 'secondary': return '#374151';
      case 'success': return '#06b6d4';
      case 'danger': return '#ef4444';
      default: return '#374151';
    }
  }};
  color: white;
  border: 2px solid ${props => {
    switch (props.$variant) {
      case 'primary': return '#db2777';
      case 'secondary': return '#4b5563';
      case 'success': return '#0891b2';
      case 'danger': return '#dc2626';
      default: return '#4b5563';
    }
  }};
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
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
      case 'authorized': return 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)';
      case 'denied': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'expired': return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
      default: return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  }};
  border: 2px solid ${props => {
    switch (props.$status) {
      case 'pending': return '#d97706';
      case 'authorized': return '#0891b2';
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

// Server Base
const ServerBase = styled.div`
  background: linear-gradient(135deg, #312e81 0%, #1e1b4b 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #ec4899;
`;

interface MCPServerDeviceFlowProps {
  state: DeviceFlowState;
  onStateUpdate: (newState: DeviceFlowState) => void;
  onComplete: (tokens: any) => void;
  onError: (error: string) => void;
}

const MCPServerDeviceFlow: React.FC<MCPServerDeviceFlowProps> = ({
  state,
  onStateUpdate,
  onComplete,
  onError,
}) => {
  const handleCopyUserCode = () => {
    navigator.clipboard.writeText(state.userCode);
    logger.info('MCPServerDeviceFlow', 'User code copied to clipboard');
  };

  const handleCopyVerificationUri = () => {
    navigator.clipboard.writeText(state.verificationUri);
    logger.info('MCPServerDeviceFlow', 'Verification URI copied to clipboard');
  };

  const handleOpenVerificationUri = () => {
    window.open(state.verificationUriComplete, '_blank');
    logger.info('MCPServerDeviceFlow', 'Verification URI opened in new tab');
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
        return 'CONTEXT AUTHORIZATION';
      case 'authorized':
        return 'MCP SERVER AUTHORIZED';
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
    <MCPServerContainer>
      {/* Server Header */}
      <ServerHeader>
        <ServerTitle>
          <FiServer style={{ marginRight: '0.5rem' }} />
          MCP Server Console
        </ServerTitle>
        <ServerSubtitle>Model Context Protocol Server Authorization</ServerSubtitle>
      </ServerHeader>

      {/* Server Status Indicators */}
      <ServerIndicators>
        <ServerIndicator $active={state.status === 'pending'} $color="#f59e0b" />
        <ServerIndicator $active={state.status === 'authorized'} $color="#06b6d4" />
        <ServerIndicator $active={state.status === 'denied'} $color="#ef4444" />
        <ServerIndicator $active={state.status === 'expired'} $color="#6b7280" />
      </ServerIndicators>

      {/* Server Display Screen */}
      <ServerDisplayScreen>
        <ScreenLabel>Context Authorization Token</ScreenLabel>
        <UserCodeDisplay>
          {deviceFlowService.formatUserCode(state.userCode)}
        </UserCodeDisplay>
      </ServerDisplayScreen>

      {/* QR Code Section */}
      <QRCodeSection>
        <QRCodeLabel>
          <FiDatabase style={{ marginRight: '0.5rem' }} />
          Context Bridge Scanner
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

      {/* Server Control Panel */}
      <ServerControlPanel>
        <ServerControlButton $variant="secondary" onClick={handleCopyUserCode}>
          <FiCopy /> Copy Token
        </ServerControlButton>
        <ServerControlButton $variant="secondary" onClick={handleCopyVerificationUri}>
          <FiCopy /> Copy URI
        </ServerControlButton>
        <ServerControlButton $variant="primary" onClick={handleOpenVerificationUri}>
          <FiExternalLink /> Authorize
        </ServerControlButton>
      </ServerControlPanel>

      {/* Status Display */}
      <StatusDisplay $status={state.status}>
        <StatusIcon>{getStatusIcon()}</StatusIcon>
        <StatusText>{getStatusText()}</StatusText>
        <StatusMessage>{getStatusMessage()}</StatusMessage>
      </StatusDisplay>

      {/* Success Display */}
      {state.status === 'authorized' && state.tokens && (
        <div style={{ 
          background: '#1e293b', 
          border: '2px solid #06b6d4', 
          borderRadius: '0.75rem', 
          padding: '1.5rem',
          marginTop: '1rem'
        }}>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: '700', 
            color: '#06b6d4', 
            textAlign: 'center',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <FiLink style={{ marginRight: '0.5rem' }} />
            MCP Server Authorized!
          </div>
          <div style={{
            background: '#000000',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #374151'
          }}>
            <JSONHighlighter data={state.tokens} />
          </div>
        </div>
      )}

      {/* Server Base */}
      <ServerBase />
    </MCPServerContainer>
  );
};

export default MCPServerDeviceFlow;



