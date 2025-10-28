// src/components/SonyGameControllerDeviceFlow.tsx
// Sony DualSense Game Controller Style Device Authorization Flow Interface
// Designed to look like actual Sony PlayStation DualSense controller

import React from 'react';
import { FiCopy, FiExternalLink, FiCheckCircle, FiAlertTriangle, FiXCircle, FiPlay, FiPause, FiVolume2 } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import InlineTokenDisplay from './InlineTokenDisplay';

// Sony DualSense Controller Physical Housing - Authentic White Design
const SonyControllerContainer = styled.div`
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  position: relative;
  color: #1e293b;
  
  /* DualSense specific styling - white with subtle gradients */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 1.8rem;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%);
    pointer-events: none;
  }
  
  /* PlayStation logo area */
  &::after {
    content: 'PS';
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    font-weight: 700;
    color: #3b82f6;
    letter-spacing: 0.5px;
    z-index: 2;
  }
`;

// Controller Face Buttons (D-Pad, Action Buttons) - Authentic Layout
const ControllerFace = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1.5rem 0;
  padding: 0 1rem;
  
  /* DualSense has D-pad on left, action buttons on right */
  gap: 3rem;
`;

const DPad = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  width: 80px;
  height: 80px;
`;

const DPadButton = styled.div`
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 2px solid #4b5563;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #ffffff;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 6px 12px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ControllerActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  width: 80px;
  height: 80px;
`;

const ActionButton = styled.div<{ $color: string }>`
  background: ${({ $color }) => $color};
  border: 2px solid ${({ $color }) => $color};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 
      0 6px 12px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const CenterSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

// PlayStation Logo
const PlayStationLogo = styled.div`
  font-size: 1.5rem;
  font-weight: 900;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 0.5rem;
`;

const ControllerModel = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

// Status Display
const StatusDisplay = styled.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 2px solid #374151;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #374151;
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatusLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusValue = styled.div<{ $status?: string }>`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => {
    switch (props.$status) {
      case 'connected': return '#10b981';
      case 'disconnected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#ffffff';
    }
  }};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusDot = styled.div<{ $active: boolean; $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$active ? props.$color : '#6b7280'};
  box-shadow: ${props => props.$active ? `0 0 8px ${props.$color}` : 'none'};
  animation: ${props => props.$active ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// Authorization Code Display
const AuthCodeDisplay = styled.div`
  background: #000000;
  color: #00ff00;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #00ff00;
  border: 2px solid #00ff00;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3);
  text-align: center;
`;

// QR Code Section
const QRCodeSection = styled.div`
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin: 1rem 0;
  border: 2px solid #e5e7eb;
`;

const QRTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const QRSubtitle = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`;

const QRCodeContainer = styled.div`
  display: inline-block;
  padding: 1rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

// Action Buttons
const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const UIActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  background: ${props => props.$variant === 'primary' ? '#3b82f6' : '#6b7280'};
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// Success Display
const SuccessDisplay = styled.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-top: 1rem;
  text-align: center;
  color: #ffffff;
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
`;

const SuccessTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const SuccessMessage = styled.div`
  font-size: 0.875rem;
  opacity: 0.9;
`;

interface SonyGameControllerDeviceFlowProps {
  state: DeviceFlowState;
  onStateUpdate: (newState: DeviceFlowState) => void;
  onComplete: (tokens: any) => void;
  onError: (error: string) => void;
}

const SonyGameControllerDeviceFlow: React.FC<SonyGameControllerDeviceFlowProps> = ({
  state,
  onStateUpdate,
  onComplete,
  onError,
}) => {
  const handleCopyUserCode = () => {
    navigator.clipboard.writeText(state.userCode);
    logger.info('SonyGameControllerDeviceFlow', 'User code copied to clipboard');
  };

  const handleOpenVerificationUri = () => {
    window.open(state.verificationUriComplete, '_blank');
    logger.info('SonyGameControllerDeviceFlow', 'Verification URI opened in new tab');
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
        return 'Awaiting Authorization';
      case 'authorized':
        return 'Controller Connected';
      case 'denied':
        return 'Connection Denied';
      case 'expired':
        return 'Session Expired';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <SonyControllerContainer>
      {/* PlayStation Branding */}
      <CenterSection>
        <PlayStationLogo>PlayStation</PlayStationLogo>
        <ControllerModel>DualSense Wireless Controller</ControllerModel>
      </CenterSection>

      {/* Controller Face Buttons */}
      <ControllerFace>
        {/* D-Pad */}
        <DPad>
          <DPadButton>↑</DPadButton>
          <DPadButton>→</DPadButton>
          <DPadButton>↓</DPadButton>
          <DPadButton>←</DPadButton>
        </DPad>

        {/* Center Section */}
        <CenterSection>
          <AuthCodeDisplay>
            {deviceFlowService.formatUserCode(state.userCode)}
          </AuthCodeDisplay>
        </CenterSection>

        {/* Action Buttons */}
        <ControllerActionButtons>
          <ActionButton $color="#ef4444">△</ActionButton>
          <ActionButton $color="#3b82f6">○</ActionButton>
          <ActionButton $color="#f59e0b">□</ActionButton>
          <ActionButton $color="#10b981">✕</ActionButton>
        </ControllerActionButtons>
      </ControllerFace>

      {/* Status Display */}
      <StatusDisplay>
        <StatusRow>
          <StatusLabel>Battery</StatusLabel>
          <StatusValue $status="connected">
            <StatusDot $active={true} $color="#10b981" />
            87% - Good
          </StatusValue>
        </StatusRow>
        <StatusRow>
          <StatusLabel>Connection</StatusLabel>
          <StatusValue $status={state.status === 'authorized' ? 'connected' : 'disconnected'}>
            <StatusDot $active={state.status === 'authorized'} $color="#10b981" />
            {state.status === 'authorized' ? 'Connected' : 'Disconnected'}
          </StatusValue>
        </StatusRow>
        <StatusRow>
          <StatusLabel>Status</StatusLabel>
          <StatusValue $status={state.status}>
            {getStatusIcon()}
            {getStatusText()}
          </StatusValue>
        </StatusRow>
      </StatusDisplay>

      {/* QR Code Section */}
      <QRCodeSection>
        <QRTitle>Connect to PlayStation Network</QRTitle>
        <QRSubtitle>
          Scan this QR code with your phone to complete setup
        </QRSubtitle>
        <QRCodeContainer>
          <QRCodeSVG
            value={state.verificationUriComplete}
            size={160}
            bgColor="#ffffff"
            fgColor="#1f2937"
            level="H"
            includeMargin={true}
          />
        </QRCodeContainer>
        <ActionButtons>
          <UIActionButton $variant="secondary" onClick={handleCopyUserCode}>
            <FiCopy /> Copy Code
          </UIActionButton>
          <UIActionButton $variant="primary" onClick={handleOpenVerificationUri}>
            <FiExternalLink /> Open App
          </UIActionButton>
        </ActionButtons>
      </QRCodeSection>

      {/* Success Display */}
      {state.status === 'authorized' && state.tokens && (
        <SuccessDisplay>
          <SuccessTitle>
            <FiCheckCircle />
            Controller Connected Successfully!
          </SuccessTitle>
          <SuccessMessage>
            Your Sony DualSense controller is now connected and ready for gaming.
          </SuccessMessage>
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginTop: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {state.tokens.access_token && (
              <InlineTokenDisplay
                label="Access Token"
                token={state.tokens.access_token}
                tokenType="access"
                isOIDC={state.tokens.id_token ? true : false}
                flowKey="device-authorization"
                defaultMasked={true}
                allowMaskToggle={true}
              />
            )}
            {state.tokens.id_token && (
              <InlineTokenDisplay
                label="ID Token"
                token={state.tokens.id_token}
                tokenType="id"
                isOIDC={true}
                flowKey="device-authorization"
                defaultMasked={true}
                allowMaskToggle={true}
              />
            )}
            {state.tokens.refresh_token && (
              <InlineTokenDisplay
                label="Refresh Token"
                token={state.tokens.refresh_token}
                tokenType="refresh"
                isOIDC={state.tokens.id_token ? true : false}
                flowKey="device-authorization"
                defaultMasked={true}
                allowMaskToggle={true}
              />
            )}
          </div>
        </SuccessDisplay>
      )}
    </SonyControllerContainer>
  );
};

export default SonyGameControllerDeviceFlow;
