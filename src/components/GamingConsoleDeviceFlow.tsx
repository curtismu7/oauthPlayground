// src/components/GamingConsoleDeviceFlow.tsx
// Gaming Console Style Device Authorization Flow Interface

import React, { useEffect, useState } from 'react';
import { FiCopy, FiExternalLink, FiRefreshCw, FiXCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import JSONHighlighter from './JSONHighlighter';

// Gaming Console Main Container - Dark with gaming aesthetics
const GamingConsoleContainer = styled.div`
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.4),
    0 10px 10px -5px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 2px solid #333333;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(0, 150, 255, 0.05) 50%, transparent 70%);
    pointer-events: none;
  }
`;

// Console Header
const ConsoleHeader = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border: 2px solid #0096ff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
`;

const ConsoleTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #0096ff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(0, 150, 255, 0.5);
`;

const ConsoleSubtitle = styled.div`
  font-size: 1rem;
  color: #cccccc;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// LED Status Indicators
const LEDIndicators = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const LEDIndicator = styled.div<{ $active: boolean; $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$active ? props.$color : '#333333'};
  box-shadow: ${props => props.$active ? `0 0 15px ${props.$color}` : 'none'};
  animation: ${props => props.$active ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// Main Display Screen
const DisplayScreen = styled.div`
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  border: 3px solid #0096ff;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(0, 150, 255, 0.2);
`;

const ScreenLabel = styled.div`
  color: #0096ff;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const UserCodeDisplay = styled.div`
  background: #000000;
  color: #00ff00;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #00ff00;
  border: 2px solid #00ff00;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3);
`;

// QR Code Section
const QRCodeSection = styled.div`
  background: #1a1a1a;
  border: 2px solid #0096ff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const QRCodeLabel = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #0096ff;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

// Game Controller Buttons
const ControllerButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ControllerButton = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'danger' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return '#0096ff';
      case 'secondary': return '#333333';
      case 'success': return '#00ff00';
      case 'danger': return '#ff0000';
      default: return '#333333';
    }
  }};
  color: white;
  border: 2px solid ${props => {
    switch (props.$variant) {
      case 'primary': return '#007acc';
      case 'secondary': return '#555555';
      case 'success': return '#00cc00';
      case 'danger': return '#cc0000';
      default: return '#555555';
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
      case 'pending': return 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)';
      case 'authorized': return 'linear-gradient(135deg, #00ff00 0%, #32cd32 100%)';
      case 'denied': return 'linear-gradient(135deg, #ff0000 0%, #dc143c 100%)';
      case 'expired': return 'linear-gradient(135deg, #666666 0%, #404040 100%)';
      default: return 'linear-gradient(135deg, #666666 0%, #404040 100%)';
    }
  }};
  border: 2px solid ${props => {
    switch (props.$status) {
      case 'pending': return '#ff8c00';
      case 'authorized': return '#32cd32';
      case 'denied': return '#dc143c';
      case 'expired': return '#404040';
      default: return '#404040';
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

// Console Base
const ConsoleBase = styled.div`
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #0096ff;
`;

interface GamingConsoleDeviceFlowProps {
  state: DeviceFlowState;
  onStateUpdate: (newState: DeviceFlowState) => void;
  onComplete: (tokens: any) => void;
  onError: (error: string) => void;
}

const GamingConsoleDeviceFlow: React.FC<GamingConsoleDeviceFlowProps> = ({
  state,
  onStateUpdate,
  onComplete,
  onError,
}) => {
  const handleCopyUserCode = () => {
    navigator.clipboard.writeText(state.userCode);
    logger.info('GamingConsoleDeviceFlow', 'User code copied to clipboard');
  };

  const handleCopyVerificationUri = () => {
    navigator.clipboard.writeText(state.verificationUri);
    logger.info('GamingConsoleDeviceFlow', 'Verification URI copied to clipboard');
  };

  const handleOpenVerificationUri = () => {
    window.open(state.verificationUriComplete, '_blank');
    logger.info('GamingConsoleDeviceFlow', 'Verification URI opened in new tab');
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
        return 'AUTHORIZATION PENDING';
      case 'authorized':
        return 'AUTHORIZATION COMPLETE';
      case 'denied':
        return 'AUTHORIZATION DENIED';
      case 'expired':
        return 'AUTHORIZATION EXPIRED';
      default:
        return 'UNKNOWN STATUS';
    }
  };

  const getStatusMessage = () => {
    return deviceFlowService.getStatusMessage(state);
  };

  return (
    <GamingConsoleContainer>
      {/* Console Header */}
      <ConsoleHeader>
        <ConsoleTitle>Gaming Console</ConsoleTitle>
        <ConsoleSubtitle>Device Authorization System</ConsoleSubtitle>
      </ConsoleHeader>

      {/* LED Status Indicators */}
      <LEDIndicators>
        <LEDIndicator $active={state.status === 'pending'} $color="#ffa500" />
        <LEDIndicator $active={state.status === 'authorized'} $color="#00ff00" />
        <LEDIndicator $active={state.status === 'denied'} $color="#ff0000" />
        <LEDIndicator $active={state.status === 'expired'} $color="#666666" />
      </LEDIndicators>

      {/* Main Display Screen */}
      <DisplayScreen>
        <ScreenLabel>Authorization Code</ScreenLabel>
        <UserCodeDisplay>
          {deviceFlowService.formatUserCode(state.userCode)}
        </UserCodeDisplay>
      </DisplayScreen>

      {/* QR Code Section */}
      <QRCodeSection>
        <QRCodeLabel>QR Code Scanner</QRCodeLabel>
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

      {/* Controller Buttons */}
      <ControllerButtons>
        <ControllerButton $variant="secondary" onClick={handleCopyUserCode}>
          <FiCopy /> Copy
        </ControllerButton>
        <ControllerButton $variant="secondary" onClick={handleCopyVerificationUri}>
          <FiCopy /> URI
        </ControllerButton>
        <ControllerButton $variant="primary" onClick={handleOpenVerificationUri}>
          <FiExternalLink /> Open
        </ControllerButton>
        <ControllerButton $variant="success" onClick={() => window.location.reload()}>
          <FiRefreshCw /> Reset
        </ControllerButton>
      </ControllerButtons>

      {/* Status Display */}
      <StatusDisplay $status={state.status}>
        <StatusIcon>{getStatusIcon()}</StatusIcon>
        <StatusText>{getStatusText()}</StatusText>
        <StatusMessage>{getStatusMessage()}</StatusMessage>
      </StatusDisplay>

      {/* Success Display */}
      {state.status === 'authorized' && state.tokens && (
        <div style={{ 
          background: '#1a1a1a', 
          border: '2px solid #00ff00', 
          borderRadius: '0.75rem', 
          padding: '1.5rem',
          marginTop: '1rem'
        }}>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: '700', 
            color: '#00ff00', 
            textAlign: 'center',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <FiCheckCircle style={{ marginRight: '0.5rem' }} />
            Authorization Successful!
          </div>
          <div style={{
            background: '#000000',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #333333'
          }}>
            <JSONHighlighter data={state.tokens} />
          </div>
        </div>
      )}

      {/* Console Base */}
      <ConsoleBase />
    </GamingConsoleContainer>
  );
};

export default GamingConsoleDeviceFlow;
