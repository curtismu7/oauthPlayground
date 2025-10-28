// src/components/SquarePOSDeviceFlow.tsx
// Square POS Terminal Style Device Authorization Flow Interface
// Designed to look like actual Square POS hardware

import React from 'react';
import { FiCopy, FiExternalLink, FiCheckCircle, FiAlertTriangle, FiXCircle, FiCreditCard, FiDollarSign, FiFileText } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import { UnifiedTokenDisplayService } from '../services/unifiedTokenDisplayService';

// Square POS Terminal Main Container - Authentic Square Design
const SquarePOSContainer = styled.div<{ $authorized?: boolean }>`
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  position: relative;
  color: #1e293b;
`;

// POS Display Screen - Physical Terminal Display
const POSDisplayScreen = styled.div`
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border-radius: 0.5rem;
  padding: 0;
  margin-bottom: 1.5rem;
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.1),
    0 0 0 3px #1e293b;
  border: 3px solid #cbd5e1;
  overflow: hidden;
  position: relative;
  min-height: 400px;
`;

const POSDisplayHeader = styled.div`
  background: linear-gradient(90deg, #00d4aa 0%, #00cc6a 100%);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const POSDisplayText = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 1px;
`;

const DisplayStatus = styled.div<{ $status: string }>`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $status }) => 
    $status === 'authorized' ? '#00ff88' : '#ffffff'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SquareTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const SquareSubtitle = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
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

const ScreenLabel = styled.div`
  /* Use inline styles for flexibility */
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
      {/* Square POS Display Screen */}
      <POSDisplayScreen>
        <POSDisplayHeader>
          <POSDisplayText>Square POS</POSDisplayText>
          <DisplayStatus $status={state.status}>
            {state.status === 'authorized' ? 'READY' : state.status === 'pending' ? 'AUTHORIZING' : state.status === 'denied' ? 'DENIED' : 'IDLE'}
          </DisplayStatus>
        </POSDisplayHeader>
        
        <div style={{ padding: '1.5rem' }}>
          <SquareTitle>
            <FiCreditCard style={{ marginRight: '0.5rem', color: '#00d4aa' }} />
            Authorization Required
          </SquareTitle>
          
          <div style={{ marginTop: '1.5rem' }}>
            <ScreenLabel style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Payment Authorization Code
            </ScreenLabel>
            <AuthCodeDisplay>
              {deviceFlowService.formatUserCode(state.userCode)}
            </AuthCodeDisplay>
          </div>
        </div>
      </POSDisplayScreen>

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
          {/* Token Display - Full Width Independent of Device */}
          <div style={{
            width: '100%',
            maxWidth: '60rem',
            margin: '1rem auto'
          }}>
            {UnifiedTokenDisplayService.showTokens(
              state.tokens as any,
              'oauth',
              'device-authorization-v7',
              {
                showCopyButtons: true,
                showDecodeButtons: true,
                inlineDecode: true,
              }
            )}
          </div>
        </SuccessDisplay>
      )}
    </SquarePOSContainer>
  );
};

export default SquarePOSDeviceFlow;
