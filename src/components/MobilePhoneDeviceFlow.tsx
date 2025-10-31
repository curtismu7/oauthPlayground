// src/components/MobilePhoneDeviceFlow.tsx
// Mobile Phone Style Device Authorization Flow Interface

import React, { useEffect, useState } from 'react';
import { FiCopy, FiExternalLink, FiRefreshCw, FiXCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import InlineTokenDisplay from './InlineTokenDisplay';

// iPhone 17 Pro Main Container - Authentic Titanium Frame Design
const MobilePhoneContainer = styled.div`
  background: linear-gradient(135deg, #5a5a5c 0%, #8e8e93 10%, #5a5a5c 100%);
  border-radius: 3.5rem;
  padding: 0.25rem;
  margin: 2rem 0;
  box-shadow: 
    0 35px 70px rgba(0, 0, 0, 0.6),
    0 15px 30px rgba(0, 0, 0, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.3),
    inset 0 -1px 2px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: visible;
  border: 2px solid #6e6e73;
  max-width: 390px;
  margin-left: auto;
  margin-right: auto;
  color: #1f2937;
  
  /* iPhone 17 Pro Triple Camera Bump */
  &::before {
    content: '';
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, #3a3a3c 0%, #2c2c2e 100%);
    border-radius: 1.25rem;
    z-index: 11;
    box-shadow: 
      0 4px 8px rgba(0, 0, 0, 0.4),
      inset 0 1px 2px rgba(255, 255, 255, 0.1);
    
    /* Camera lenses */
    background-image: 
      radial-gradient(circle at 25% 30%, #1a1a1a 18%, transparent 18%),
      radial-gradient(circle at 75% 30%, #1a1a1a 18%, transparent 18%),
      radial-gradient(circle at 50% 70%, #1a1a1a 18%, transparent 18%);
  }
  
  /* iPhone 17 Pro Home Indicator */
  &::after {
    content: '';
    position: absolute;
    bottom: 0.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 140px;
    height: 4px;
    background: rgba(255, 255, 255, 0.4);
    border-radius: 2px;
    z-index: 10;
  }
`;

// iPhone 17 Pro Screen - iOS 18 Design with Dynamic Island
const PhoneScreen = styled.div`
  background: linear-gradient(180deg, #000000 0%, #1c1c1e 100%);
  border-radius: 3.25rem;
  padding: 3rem 1.25rem 1.5rem;
  position: relative;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
  color: #ffffff;
  min-height: 780px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow: hidden;
  
  /* Dynamic Island */
  &::before {
    content: '';
    position: absolute;
    top: 0.75rem;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 35px;
    background: #000000;
    border-radius: 1.75rem;
    z-index: 100;
    box-shadow: 
      inset 0 1px 3px rgba(0, 0, 0, 0.8),
      0 2px 8px rgba(0, 0, 0, 0.5);
  }
  
  /* iOS 18 Status Bar - Time */
  &::after {
    content: '9:41';
    position: absolute;
    top: 0.9rem;
    left: 1.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #ffffff;
    z-index: 101;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  }
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

// iOS 18 Status Bar Indicators
const IOSStatusBar = styled.div`
  position: absolute;
  top: 0.9rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  z-index: 101;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
`;

const SignalIcon = styled.div`
  width: 18px;
  height: 12px;
  background: linear-gradient(to right, 
    #ffffff 0%, #ffffff 20%, transparent 20%, transparent 25%,
    #ffffff 25%, #ffffff 45%, transparent 45%, transparent 50%,
    #ffffff 50%, #ffffff 70%, transparent 70%, transparent 75%,
    #ffffff 75%, #ffffff 95%);
`;

const WifiIcon = styled.div`
  font-size: 0.75rem;
  color: #ffffff;
  font-weight: 600;
`;

const BatteryIndicator = styled.div`
  width: 24px;
  height: 11px;
  border: 2px solid #ffffff;
  border-radius: 3px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    width: 80%;
    height: 60%;
    background: #34c759;
    border-radius: 1px;
  }
  
  &::after {
    content: '';
    position: absolute;
    right: -4px;
    top: 50%;
    transform: translateY(-50%);
    width: 2px;
    height: 5px;
    background: #ffffff;
    border-radius: 0 2px 2px 0;
  }
`;

// App Header
const AppHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  margin-top: 2rem;
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

// iOS-style User Code Display
const UserCodeDisplay = styled.div`
  background: rgba(120, 120, 128, 0.16);
  color: #0a84ff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Mono', monospace;
  font-size: 2rem;
  font-weight: 700;
  padding: 1.5rem 1rem;
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.15em;
  text-align: center;
  border: 1px solid rgba(120, 120, 128, 0.24);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
`;

// iOS-style QR Code Section
const QRCodeSection = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(120, 120, 128, 0.24);
  border-radius: 1rem;
  padding: 1.25rem;
  text-align: center;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(10px);
`;

const QRCodeLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #8e8e93;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

// iOS-style Buttons
const TouchButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
`;

const TouchButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  background: ${props => props.$variant === 'primary' ? '#0a84ff' : 'rgba(120, 120, 128, 0.24)'};
  color: ${props => props.$variant === 'primary' ? '#ffffff' : '#0a84ff'};
  border: none;
  border-radius: 0.75rem;
  padding: 0.875rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  box-shadow: ${props => props.$variant === 'primary' ? 
    '0 2px 8px rgba(10, 132, 255, 0.4)' : 
    '0 1px 3px rgba(0, 0, 0, 0.2)'};
  
  &:hover {
    background: ${props => props.$variant === 'primary' ? '#0077ed' : 'rgba(120, 120, 128, 0.32)'};
    transform: scale(0.98);
  }
  
  &:active {
    transform: scale(0.96);
    opacity: 0.8;
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
      {/* iPhone 17 Pro Screen */}
      <PhoneScreen>
        {/* iOS 18 Status Bar Indicators */}
        <IOSStatusBar>
          <SignalIcon />
          <WifiIcon>Wi-Fi</WifiIcon>
          <BatteryIndicator />
        </IOSStatusBar>

        {/* App Header */}
        <AppHeader>
          <AppTitle>Device Authorization</AppTitle>
          <AppSubtitle>iPhone 17 Pro</AppSubtitle>
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
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {state.tokens.access_token && (
                <div style={{
                  background: '#000000',
                  padding: '0.75rem',
                  borderRadius: '0.5rem'
                }}>
             <InlineTokenDisplay
               label="Access Token"
               token={state.tokens.access_token}
               tokenType="access"
               isOIDC={state.tokens.id_token ? true : false}
               flowKey="device-authorization"
               defaultMasked={false}
               allowMaskToggle={true}
             />
                </div>
              )}
              {state.tokens.id_token && (
                <div style={{
                  background: '#000000',
                  padding: '0.75rem',
                  borderRadius: '0.5rem'
                }}>
                  <InlineTokenDisplay
                    label="ID Token"
                    token={state.tokens.id_token}
                    tokenType="id"
                    isOIDC={true}
                    flowKey="device-authorization"
                    defaultMasked={false}
                    allowMaskToggle={true}
                  />
                </div>
              )}
              {state.tokens.refresh_token && (
                <div style={{
                  background: '#000000',
                  padding: '0.75rem',
                  borderRadius: '0.5rem'
                }}>
                  <InlineTokenDisplay
                    label="Refresh Token"
                    token={state.tokens.refresh_token}
                    tokenType="refresh"
                    isOIDC={state.tokens.id_token ? true : false}
                    flowKey="device-authorization"
                    defaultMasked={false}
                    allowMaskToggle={true}
                  />
                </div>
              )}
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
