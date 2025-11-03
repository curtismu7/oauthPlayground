// src/components/FitnessTrackerDeviceFlow.tsx
// Fitness Tracker Style Device Authorization Flow Interface

import React, { useEffect, useState } from 'react';
import { FiCopy, FiExternalLink, FiRefreshCw, FiXCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import StandardizedTokenDisplay from './StandardizedTokenDisplay';

// Fitbit Main Container - Authentic Fitbit Design
const FitnessTrackerContainer = styled.div`
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 2rem 0;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 2px solid #333333;
  max-width: 350px;
  margin-left: auto;
  margin-right: auto;
  color: #ffffff;
  
  /* Fitbit branding */
  &::before {
    content: 'FITBIT';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #00d4aa;
    letter-spacing: 1px;
    z-index: 2;
  }
  
  /* Fitbit strap texture */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 1rem;
    background: linear-gradient(90deg, transparent 0%, rgba(0, 212, 170, 0.05) 50%, transparent 100%);
    pointer-events: none;
  }
`;

// Watch Face
const WatchFace = styled.div`
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  border: 3px solid #00ff96;
  border-radius: 50%;
  width: 200px;
  height: 200px;
  margin: 0 auto 1.5rem auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(0, 255, 150, 0.3);
`;

const WatchBrand = styled.div`
  position: absolute;
  top: 1rem;
  color: #00ff96;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const WatchTime = styled.div`
  color: #00ff96;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 10px rgba(0, 255, 150, 0.5);
`;

const WatchDate = styled.div`
  color: #cccccc;
  font-size: 0.875rem;
  margin-bottom: 1rem;
`;

// User Code Display
const UserCodeDisplay = styled.div`
  background: #000000;
  color: #00ff96;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(0, 255, 150, 0.5);
  border: 1px solid #00ff96;
  text-align: center;
`;

// Status Ring
const StatusRing = styled.div<{ $status: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => {
    switch (props.$status) {
      case 'pending': return '#ffa500';
      case 'authorized': return '#00ff96';
      case 'denied': return '#ff0000';
      case 'expired': return '#666666';
      default: return '#666666';
    }
  }};
  box-shadow: ${props => {
    switch (props.$status) {
      case 'pending': return '0 0 15px #ffa500';
      case 'authorized': return '0 0 15px #00ff96';
      case 'denied': return '0 0 15px #ff0000';
      case 'expired': return '0 0 15px #666666';
      default: return '0 0 15px #666666';
    }
  }};
  animation: ${props => props.$status === 'pending' ? 'pulse 2s infinite' : 'none'};
  margin: 0 auto 1rem auto;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// QR Code Section
const QRCodeSection = styled.div`
  background: #1a1a1a;
  border: 2px solid #00ff96;
  border-radius: 1rem;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const QRCodeLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #00ff96;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

// Control Buttons
const ControlButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const ControlButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  background: ${props => props.$variant === 'primary' ? '#00ff96' : '#404040'};
  color: ${props => props.$variant === 'primary' ? '#000000' : '#ffffff'};
  border: none;
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &:hover {
    background: ${props => props.$variant === 'primary' ? '#00cc77' : '#555555'};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
`;

// Status Display
const StatusDisplay = styled.div<{ $status: string }>`
  background: ${props => {
    switch (props.$status) {
      case 'pending': return 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)';
      case 'authorized': return 'linear-gradient(135deg, #00ff96 0%, #00cc77 100%)';
      case 'denied': return 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)';
      case 'expired': return 'linear-gradient(135deg, #666666 0%, #404040 100%)';
      default: return 'linear-gradient(135deg, #666666 0%, #404040 100%)';
    }
  }};
  border: 2px solid ${props => {
    switch (props.$status) {
      case 'pending': return '#ff8c00';
      case 'authorized': return '#00cc77';
      case 'denied': return '#cc0000';
      case 'expired': return '#404040';
      default: return '#404040';
    }
  }};
  border-radius: 1rem;
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

// Watch Band
const WatchBand = styled.div`
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  height: 1rem;
  border-radius: 0 0 1rem 1rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #00ff96;
`;

interface FitnessTrackerDeviceFlowProps {
  state: DeviceFlowState;
  onStateUpdate: (newState: DeviceFlowState) => void;
  onComplete: (tokens: any) => void;
  onError: (error: string) => void;
}

const FitnessTrackerDeviceFlow: React.FC<FitnessTrackerDeviceFlowProps> = ({
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
    logger.info('FitnessTrackerDeviceFlow', 'User code copied to clipboard');
  };

  const handleCopyVerificationUri = () => {
    navigator.clipboard.writeText(state.verificationUri);
    logger.info('FitnessTrackerDeviceFlow', 'Verification URI copied to clipboard');
  };

  const handleOpenVerificationUri = () => {
    window.open(state.verificationUriComplete, '_blank');
    logger.info('FitnessTrackerDeviceFlow', 'Verification URI opened in new tab');
  };

  const getStatusText = () => {
    switch (state.status) {
      case 'pending':
        return 'AUTH PENDING';
      case 'authorized':
        return 'AUTH COMPLETE';
      case 'denied':
        return 'AUTH DENIED';
      case 'expired':
        return 'AUTH EXPIRED';
      default:
        return 'UNKNOWN';
    }
  };

  const getStatusMessage = () => {
    return deviceFlowService.getStatusMessage(state);
  };

  return (
    <>
    <FitnessTrackerContainer>
      {/* Watch Face */}
      <WatchFace>
        <WatchBrand>Fitness Tracker</WatchBrand>
        <WatchTime>
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </WatchTime>
        <WatchDate>
          {currentTime.toLocaleDateString()}
        </WatchDate>
        
        <UserCodeDisplay>
          {deviceFlowService.formatUserCode(state.userCode)}
        </UserCodeDisplay>
      </WatchFace>

      {/* Status Ring */}
      <StatusRing $status={state.status} />

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

      {/* Control Buttons */}
      <ControlButtons>
        <ControlButton $variant="secondary" onClick={handleCopyUserCode}>
          <FiCopy /> Copy
        </ControlButton>
        <ControlButton $variant="primary" onClick={handleOpenVerificationUri}>
          <FiExternalLink /> Open
        </ControlButton>
      </ControlButtons>

      {/* Status Display */}
      <StatusDisplay $status={state.status}>
        <StatusText>{getStatusText()}</StatusText>
        <StatusMessage>{getStatusMessage()}</StatusMessage>
      </StatusDisplay>

      {/* Success Display */}
      {state.status === 'authorized' && (
        <div style={{ 
          background: '#1a1a1a', 
          border: '2px solid #00ff96', 
          borderRadius: '1rem', 
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <div style={{ 
            fontSize: '0.875rem', 
            fontWeight: '700', 
            color: '#00ff96', 
            textAlign: 'center',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <FiCheckCircle style={{ marginRight: '0.5rem' }} />
            Authorization Complete!
          </div>
        </div>
      )}

      {/* Watch Band */}
      <WatchBand />
    </FitnessTrackerContainer>

    {/* Token Display Section - RENDERED OUTSIDE container to be truly independent */}
    <StandardizedTokenDisplay 
      tokens={state.tokens}
      backgroundColor="rgba(0, 0, 0, 0.4)"
      borderColor="#374151"
      headerTextColor="#00ff96"
    />
    </>
  );
};

export default FitnessTrackerDeviceFlow;
