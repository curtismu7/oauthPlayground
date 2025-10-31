// src/components/SquarePOSDeviceFlow.tsx
// Square POS Terminal Style Device Authorization Flow Interface
// Designed to look like actual Square POS hardware

import React from 'react';
import { FiCopy, FiExternalLink, FiCheckCircle, FiAlertTriangle, FiXCircle, FiCreditCard, FiDollarSign, FiFileText } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import InlineTokenDisplay from './InlineTokenDisplay';

// Square POS Terminal Main Container - Authentic Square Design
const SquarePOSContainer = styled.div<{ $authorized?: boolean }>`
  background: ${({ $authorized }) => 
    $authorized 
      ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 50%, #00ff88 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
  };
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px ${({ $authorized }) => $authorized ? '#00ff88' : '#e5e7eb'},
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  border: 2px solid ${({ $authorized }) => $authorized ? '#00ff88' : '#e5e7eb'};
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  color: ${({ $authorized }) => $authorized ? '#000000' : '#1f2937'};
  transition: all 0.3s ease;
  
  /* Square tablet design - white with modern styling */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 1rem;
    background: ${({ $authorized }) => 
      $authorized 
        ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 204, 106, 0.1) 100%)' 
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)'
    };
    pointer-events: none;
  }
  
  /* Square logo area */
  &::after {
    content: 'SQUARE';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: ${({ $authorized }) => $authorized ? '#000000' : '#00d4aa'};
    letter-spacing: 1px;
    z-index: 3;
  }
`;

// Square POS Header - Authentic Square Design
const SquareHeader = styled.div<{ $authorized?: boolean }>`
  background: ${({ $authorized }) => 
    $authorized 
      ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)' 
      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
  };
  border: 1px solid ${({ $authorized }) => $authorized ? '#00ff88' : '#e5e7eb'};
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  color: ${({ $authorized }) => $authorized ? '#000000' : '#1f2937'};
  font-weight: 600;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
`;

const SquareTitle = styled.div<{ $authorized?: boolean }>`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ $authorized }) => $authorized ? '#000000' : '#1f2937'};
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
`;

const SquareSubtitle = styled.div<{ $authorized?: boolean }>`
  font-size: 0.875rem;
  color: ${({ $authorized }) => $authorized ? '#000000' : '#6b7280'};
  font-weight: 500;
  transition: all 0.3s ease;
`;

// POS Display Screen
const POSDisplay = styled.div`
  background: #000000;
  border: 3px solid #1f2937;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.6);
  position: relative;
  overflow: hidden;
`;

const POSHeader = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  right: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #374151;
`;

const POSLogo = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: #ffffff;
`;

const POSStatus = styled.div<{ $status: string }>`
  background: ${props => {
    switch (props.$status) {
      case 'pending': return '#f59e0b';
      case 'authorized': return '#10b981';
      case 'denied': return '#ef4444';
      case 'expired': return '#6b7280';
      default: return '#6b7280';
    }
  }};
  color: #ffffff;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// POS Keypad
const POSKeypad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;
`;

const POSKey = styled.button<{ $type: 'number' | 'action' | 'special' }>`
  aspect-ratio: 1;
  background: ${props => {
    switch (props.$type) {
      case 'number': return 'linear-gradient(135deg, #374151 0%, #1f2937 100%)';
      case 'action': return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      case 'special': return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  }};
  border: 2px solid #4b5563;
  border-radius: 0.5rem;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
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

// Card Reader
const CardReader = styled.div`
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border: 2px solid #4b5563;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const CardReaderSlot = styled.div`
  width: 60px;
  height: 40px;
  background: #000000;
  border: 2px solid #4b5563;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 1.5rem;
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

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
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

interface SquarePOSDeviceFlowProps {
  state: DeviceFlowState;
  onStateUpdate: (newState: DeviceFlowState) => void;
  onComplete: (tokens: any) => void;
  onError: (error: string) => void;
}

const SquarePOSDeviceFlow: React.FC<SquarePOSDeviceFlowProps> = ({
  state,
  onStateUpdate,
  onComplete,
  onError,
}) => {
  const handleCopyUserCode = () => {
    navigator.clipboard.writeText(state.userCode);
    logger.info('SquarePOSDeviceFlow', 'User code copied to clipboard');
  };

  const handleOpenVerificationUri = () => {
    window.open(state.verificationUriComplete, '_blank');
    logger.info('SquarePOSDeviceFlow', 'Verification URI opened in new tab');
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
        return 'POS Connected';
      case 'denied':
        return 'Connection Denied';
      case 'expired':
        return 'Session Expired';
      default:
        return 'Unknown Status';
    }
  };

  const isAuthorized = state.status === 'authorized';

  return (
    <SquarePOSContainer $authorized={isAuthorized}>
      {/* Square POS Header */}
      <SquareHeader $authorized={isAuthorized}>
        <SquareTitle $authorized={isAuthorized}>
          <FiCreditCard style={{ marginRight: '0.5rem' }} />
          Square POS Terminal
        </SquareTitle>
        <SquareSubtitle $authorized={isAuthorized}>Payment Authorization System</SquareSubtitle>
      </SquareHeader>

      {/* POS Display Screen */}
      <POSDisplay>
        <POSHeader>
          <POSLogo>Square POS</POSLogo>
          <POSStatus $status={state.status}>
            {getStatusIcon()}
            {getStatusText()}
          </POSStatus>
        </POSHeader>

        <div style={{ marginTop: '2rem' }}>
          <AuthCodeDisplay>
            {deviceFlowService.formatUserCode(state.userCode)}
          </AuthCodeDisplay>
        </div>
      </POSDisplay>

      {/* POS Keypad */}
      <POSKeypad>
        <POSKey $type="number">1</POSKey>
        <POSKey $type="number">2</POSKey>
        <POSKey $type="number">3</POSKey>
        <POSKey $type="number">4</POSKey>
        <POSKey $type="number">5</POSKey>
        <POSKey $type="number">6</POSKey>
        <POSKey $type="number">7</POSKey>
        <POSKey $type="number">8</POSKey>
        <POSKey $type="number">9</POSKey>
        <POSKey $type="special">Clear</POSKey>
        <POSKey $type="number">0</POSKey>
        <POSKey $type="special">Enter</POSKey>
      </POSKeypad>

      {/* Card Reader */}
      <CardReader>
        <FiCreditCard />
        <CardReaderSlot>
          <FiCreditCard />
        </CardReaderSlot>
        <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
          Card Reader Ready
        </span>
      </CardReader>

      {/* Status Display */}
      <StatusDisplay>
        <StatusRow>
          <StatusLabel>Network</StatusLabel>
          <StatusValue $status="connected">
            <StatusDot $active={true} $color="#10b981" />
            Connected
          </StatusValue>
        </StatusRow>
        <StatusRow>
          <StatusLabel>Power</StatusLabel>
          <StatusValue>
            <StatusDot $active={true} $color="#10b981" />
            AC Power
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
        <QRTitle>Connect to Square Dashboard</QRTitle>
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
          <ActionButton $variant="secondary" onClick={handleCopyUserCode}>
            <FiCopy /> Copy Code
          </ActionButton>
          <ActionButton $variant="primary" onClick={handleOpenVerificationUri}>
            <FiExternalLink /> Open App
          </ActionButton>
        </ActionButtons>
      </QRCodeSection>

      {/* Success Display */}
      {state.status === 'authorized' && state.tokens && (
        <SuccessDisplay>
          <SuccessTitle>
            <FiCheckCircle />
            POS Terminal Connected Successfully!
          </SuccessTitle>
          <SuccessMessage>
            Your Square POS terminal is now connected and ready to process payments.
          </SuccessMessage>
          <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginTop: '1rem'
          }}>
            {state.tokens.access_token && (
              <InlineTokenDisplay
                label="Access Token"
                token={state.tokens.access_token}
                tokenType="access"
                isOIDC={state.tokens.id_token ? true : false}
                flowKey="device-authorization"
                defaultMasked={false}
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
                defaultMasked={false}
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
                defaultMasked={false}
                allowMaskToggle={true}
              />
            )}
          </div>
        </SuccessDisplay>
      )}
    </SquarePOSContainer>
  );
};

export default SquarePOSDeviceFlow;
