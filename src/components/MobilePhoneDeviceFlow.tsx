// src/components/MobilePhoneDeviceFlow.tsx
// Mobile Phone Style Device Authorization Flow Interface

import React, { useEffect, useState } from 'react';
import { FiCopy, FiExternalLink, FiRefreshCw, FiXCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import JSONHighlighter from './JSONHighlighter';

// Mobile Phone Main Container - Modern smartphone design
const MobilePhoneContainer = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  border-radius: 2rem;
  padding: 1rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 10px 10px -5px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 3px solid #404040;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
  
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

// Phone Screen
const PhoneScreen = styled.div`
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  border: 2px solid #666666;
  border-radius: 1.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
  position: relative;
  box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.5);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

// Status Bar
const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #333333;
`;

const StatusBarLeft = styled.div`
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
`;

const StatusBarRight = styled.div`
  display: flex;
  gap: 0.25rem;
  color: #ffffff;
  font-size: 0.75rem;
`;

const BatteryIcon = styled.div`
  width: 20px;
  height: 10px;
  border: 1px solid #ffffff;
  border-radius: 2px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    right: -3px;
    top: 2px;
    width: 2px;
    height: 6px;
    background: #ffffff;
    border-radius: 0 1px 1px 0;
  }
`;

// App Header
const AppHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const AppTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
`;

const AppSubtitle = styled.div`
  font-size: 0.875rem;
  color: #cccccc;
`;

// User Code Display
const UserCodeDisplay = styled.div`
  background: #000000;
  color: #00ff00;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  padding: 1rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px #00ff00;
  border: 2px solid #00ff00;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3);
`;

// QR Code Section
const QRCodeSection = styled.div`
  background: #1a1a1a;
  border: 2px solid #666666;
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const QRCodeLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

// Touch Buttons
const TouchButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
`;

const TouchButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  background: ${props => props.$variant === 'primary' ? '#007aff' : '#333333'};
  color: white;
  border: none;
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
  
  &:hover {
    background: ${props => props.$variant === 'primary' ? '#0056cc' : '#444444'};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
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
  padding: 1rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const StatusText = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusMessage = styled.div`
  font-size: 0.75rem;
  color: #ffffff;
`;

// Home Button
const HomeButton = styled.div`
  background: #333333;
  border: 2px solid #666666;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 1.25rem;
`;

interface MobilePhoneDeviceFlowProps {
  state: DeviceFlowState;
  onStateUpdate: (newState: DeviceFlowState) => void;
  onComplete: (tokens: any) => void;
  onError: (error: string) => void;
}

const MobilePhoneDeviceFlow: React.FC<MobilePhoneDeviceFlowProps> = ({
  state,
  onStateUpdate,
  onComplete,
  onError,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyUserCode = () => {
    navigator.clipboard.writeText(state.userCode);
    logger.info('MobilePhoneDeviceFlow', 'User code copied to clipboard');
  };

  const handleCopyVerificationUri = () => {
    navigator.clipboard.writeText(state.verificationUri);
    logger.info('MobilePhoneDeviceFlow', 'Verification URI copied to clipboard');
  };

  const handleOpenVerificationUri = () => {
    window.open(state.verificationUriComplete, '_blank');
    logger.info('MobilePhoneDeviceFlow', 'Verification URI opened in new tab');
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
    <MobilePhoneContainer>
      {/* Phone Screen */}
      <PhoneScreen>
        {/* Status Bar */}
        <StatusBar>
          <StatusBarLeft>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </StatusBarLeft>
          <StatusBarRight>
            <div>📶</div>
            <div>📶</div>
            <div>📶</div>
            <BatteryIcon />
          </StatusBarRight>
        </StatusBar>

        {/* App Header */}
        <AppHeader>
          <AppTitle>Device Auth</AppTitle>
          <AppSubtitle>Authorization Code</AppSubtitle>
        </AppHeader>

        {/* User Code Display */}
        <UserCodeDisplay>
          {deviceFlowService.formatUserCode(state.userCode)}
        </UserCodeDisplay>

        {/* QR Code Section */}
        <QRCodeSection>
          <QRCodeLabel>QR Code</QRCodeLabel>
          <QRCodeContainer>
            <QRCodeSVG
              value={state.verificationUriComplete}
              size={120}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              includeMargin={true}
            />
          </QRCodeContainer>
        </QRCodeSection>

        {/* Touch Buttons */}
        <TouchButtons>
          <TouchButton $variant="secondary" onClick={handleCopyUserCode}>
            <FiCopy /> Copy
          </TouchButton>
          <TouchButton $variant="primary" onClick={handleOpenVerificationUri}>
            <FiExternalLink /> Open
          </TouchButton>
        </TouchButtons>

        {/* Status Display */}
        <StatusDisplay $status={state.status}>
          <StatusText>{getStatusText()}</StatusText>
          <StatusMessage>{getStatusMessage()}</StatusMessage>
        </StatusDisplay>

        {/* Success Display */}
        {state.status === 'authorized' && state.tokens && (
          <div style={{ 
            background: '#1a1a1a', 
            border: '2px solid #00ff00', 
            borderRadius: '0.75rem', 
            padding: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{ 
              fontSize: '0.875rem', 
              fontWeight: '700', 
              color: '#00ff00', 
              textAlign: 'center',
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <FiCheckCircle style={{ marginRight: '0.5rem' }} />
              Authorization Complete!
            </div>
            <div style={{
              background: '#000000',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #333333',
              fontSize: '0.75rem'
            }}>
              <JSONHighlighter data={state.tokens} />
            </div>
          </div>
        )}
      </PhoneScreen>

      {/* Home Button */}
      <HomeButton>🏠</HomeButton>
    </MobilePhoneContainer>
  );
};

export default MobilePhoneDeviceFlow;
