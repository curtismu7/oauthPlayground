// src/components/FitnessTrackerDeviceFlow.tsx
// Fitness Tracker Style Device Authorization Flow Interface

import React, { useEffect, useState } from 'react';
import { FiCopy, FiExternalLink, FiRefreshCw, FiXCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import { UnifiedTokenDisplayService } from '../services/unifiedTokenDisplayService';

// Fitbit Main Container - Authentic Fitbit Design
const FitnessTrackerContainer = styled.div`
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  position: relative;
  color: #1e293b;
`;

// Strava App Display - Mobile Phone Interface
const PhoneScreen = styled.div`
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 8px solid #000000;
  border-radius: 2rem;
  padding: 0;
  margin: 0 auto 1.5rem auto;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.1),
    0 0 0 4px #fc4c02;
  min-height: 600px;
  width: 100%;
  max-width: 375px; /* Standard mobile width */
  overflow: hidden;
`;

// Strava Header Bar
const StravaHeader = styled.div`
  background: #ffffff;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
`;

const StravaNav = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StravaBackButton = styled.div`
  color: #fc4c02;
  font-size: 1rem;
  cursor: pointer;
`;

const StravaTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
`;

// Strava Content Area
const StravaContent = styled.div`
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
`;

// Strava Metrics Grid
const StravaMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1rem 0;
`;

const StravaMetricCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
`;

const StravaMetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const StravaMetricLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// Authorization Code Section
const AuthCodeSection = styled.div`
  background: linear-gradient(135deg, #fc4c02 0%, #e63946 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  text-align: center;
`;

const AuthCodeTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1rem;
  letter-spacing: 0.05em;
`;

const AuthCodeValue = styled.div`
  background: rgba(0, 0, 0, 0.3);
  color: #ffffff;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 1rem;
  border-radius: 0.5rem;
  letter-spacing: 0.2em;
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
    <FitnessTrackerContainer>
      {/* Strava App Phone Display */}
      <PhoneScreen>
        <StravaHeader>
          <StravaNav>
            <StravaBackButton>←</StravaBackButton>
            <StravaTitle>Run</StravaTitle>
          </StravaNav>
          <StravaTitle style={{ color: '#fc4c02', fontWeight: 700 }}>STRAVA</StravaTitle>
        </StravaHeader>
        
        <StravaContent>
          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #fc4c02 0%, #e63946 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem' }}>
              👤
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>Device Authorization</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{currentTime.toLocaleDateString()}</div>
            </div>
          </div>
          
          {/* Activity Title */}
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
            Evening Run
          </div>
          
          {/* Authorization Banner */}
          <AuthCodeSection>
            <AuthCodeTitle>Pairing Required</AuthCodeTitle>
            <AuthCodeValue>
              {deviceFlowService.formatUserCode(state.userCode)}
            </AuthCodeValue>
          </AuthCodeSection>
          
          {/* Metrics Grid */}
          <StravaMetricsGrid>
            <StravaMetricCard>
              <StravaMetricValue>1.44</StravaMetricValue>
              <StravaMetricLabel>Distance (mi)</StravaMetricLabel>
            </StravaMetricCard>
            <StravaMetricCard>
              <StravaMetricValue>19:46</StravaMetricValue>
              <StravaMetricLabel>Avg Pace /mi</StravaMetricLabel>
            </StravaMetricCard>
            <StravaMetricCard>
              <StravaMetricValue>28:29</StravaMetricValue>
              <StravaMetricLabel>Moving Time</StravaMetricLabel>
            </StravaMetricCard>
            <StravaMetricCard>
              <StravaMetricValue>147</StravaMetricValue>
              <StravaMetricLabel>Avg Heart Rate</StravaMetricLabel>
            </StravaMetricCard>
          </StravaMetricsGrid>
          
          {/* QR Code */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <QRCodeContainer>
              <QRCodeSVG
                value={state.verificationUriComplete}
                size={160}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
                includeMargin={true}
              />
            </QRCodeContainer>
          </div>
        </StravaContent>
      </PhoneScreen>

      {/* Status Display */}
      <StatusDisplay $status={state.status}>
        <StatusText>{getStatusText()}</StatusText>
        <StatusMessage>{getStatusMessage()}</StatusMessage>
      </StatusDisplay>

      {/* Success Display */}
      {state.status === 'authorized' && state.tokens && (
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
        </div>
      )}

      {/* Watch Band */}
      <WatchBand />
    </FitnessTrackerContainer>
  );
};

export default FitnessTrackerDeviceFlow;
