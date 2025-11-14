// src/components/BoseSmartSpeakerDeviceFlow.tsx
// Bose Smart Speaker Style Device Authorization Flow Interface
// Designed to look like actual Bose smart speakers

import React from 'react';
import { FiCopy, FiExternalLink, FiCheckCircle, FiAlertTriangle, FiXCircle, FiVolume2, FiPlay, FiPause, FiWifi } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import InlineTokenDisplay from './InlineTokenDisplay';

// Sonos 3 Speaker Physical Housing - Authentic Sonos 3 Design
const BoseSpeakerContainer = styled.div`
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  position: relative;
  color: #1e293b;
  
  /* Sonos 3 speaker grille texture - more refined */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 0.75rem;
    background: 
      radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.03) 0%, transparent 40%),
      radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.03) 0%, transparent 40%),
      linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.02) 50%, transparent 100%),
      linear-gradient(0deg, transparent 0%, rgba(255, 255, 255, 0.01) 50%, transparent 100%);
    pointer-events: none;
  }
  
  /* Sonos 3 logo area */
  &::after {
    content: 'SONOS 3';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: 1.5px;
    z-index: 2;
  }
`;

// Sonos 3 Logo and Branding
const BoseBranding = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const BoseLogo = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
`;

const BoseModel = styled.div`
  font-size: 0.875rem;
  color: #9ca3af;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Speaker Grill (visual element)
const SpeakerGrill = styled.div`
  width: 200px;
  height: 120px;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border-radius: 1rem;
  margin: 0 auto 1.5rem;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: 0.25rem;
  padding: 1rem;
  border: 2px solid #4b5563;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const GrillDot = styled.div`
  background: #1f2937;
  border-radius: 50%;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
`;

// Control Panel
const ControlPanel = styled.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 2px solid #374151;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #374151;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ControlLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ControlValue = styled.div<{ $status?: string }>`
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

// Music Apps Grid
const MusicAppsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin: 1rem 0;
`;

const MusicApp = styled.div<{ $color: string }>`
  aspect-ratio: 1;
  background: ${({ $color }) => $color};
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #ffffff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s ease;
  padding: 0.5rem;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const AppLabel = styled.div`
  font-size: 0.6rem;
  font-weight: 600;
  margin-top: 0.25rem;
  text-align: center;
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

interface BoseSmartSpeakerDeviceFlowProps {
  state: DeviceFlowState;
  onStateUpdate: (newState: DeviceFlowState) => void;
  onComplete: (tokens: any) => void;
  onError: (error: string) => void;
}

const BoseSmartSpeakerDeviceFlow: React.FC<BoseSmartSpeakerDeviceFlowProps> = ({
  state,
  onStateUpdate,
  onComplete,
  onError,
}) => {
  const handleCopyUserCode = () => {
    navigator.clipboard.writeText(state.userCode);
    logger.info('BoseSmartSpeakerDeviceFlow', 'User code copied to clipboard');
  };

  const handleOpenVerificationUri = () => {
    window.open(state.verificationUriComplete, '_blank');
    logger.info('BoseSmartSpeakerDeviceFlow', 'Verification URI opened in new tab');
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
        return 'Speaker Connected';
      case 'denied':
        return 'Connection Denied';
      case 'expired':
        return 'Session Expired';
      default:
        return 'Unknown Status';
    }
  };

  // Bose music apps
  const musicApps = [
    { label: 'Spotify', icon: '🎵', color: '#1db954' },
    { label: 'Apple Music', icon: '🎶', color: '#fa243c' },
    { label: 'Amazon Music', icon: '🎧', color: '#ff9900' },
    { label: 'Pandora', icon: '📻', color: '#005483' },
    { label: 'YouTube Music', icon: '🎤', color: '#ff0000' },
    { label: 'Bose Music', icon: '🔊', color: '#000000' },
    { label: 'TuneIn', icon: '🌐', color: '#14d9c4' },
    { label: 'Settings', icon: '⚙️', color: '#64748b' }
  ];

  return (
    <BoseSpeakerContainer>
      {/* Bose Branding */}
      <BoseBranding>
        <BoseLogo>BOSE</BoseLogo>
        <BoseModel>Smart Speaker 500</BoseModel>
      </BoseBranding>

      {/* Speaker Grill */}
      <SpeakerGrill>
        {Array.from({ length: 40 }, (_, i) => (
          <GrillDot key={i} />
        ))}
      </SpeakerGrill>

      {/* Control Panel */}
      <ControlPanel>
        <ControlRow>
          <ControlLabel>WiFi</ControlLabel>
          <ControlValue $status="connected">
            <StatusDot $active={true} $color="#10b981" />
            Connected
          </ControlValue>
        </ControlRow>
        <ControlRow>
          <ControlLabel>Battery</ControlLabel>
          <ControlValue>
            <StatusDot $active={true} $color="#10b981" />
            Plugged In
          </ControlValue>
        </ControlRow>
        <ControlRow>
          <ControlLabel>Status</ControlLabel>
          <ControlValue $status={state.status}>
            {getStatusIcon()}
            {getStatusText()}
          </ControlValue>
        </ControlRow>
        <ControlRow>
          <ControlLabel>Authorization Code</ControlLabel>
          <ControlValue>
            <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.1em' }}>
              {deviceFlowService.formatUserCode(state.userCode)}
            </span>
          </ControlValue>
        </ControlRow>
      </ControlPanel>

      {/* Music Apps Grid */}
      <MusicAppsGrid>
        {musicApps.map((app) => (
          <MusicApp key={app.label} $color={app.color}>
            <span style={{ fontSize: '1.25rem' }}>{app.icon}</span>
            <AppLabel>{app.label}</AppLabel>
          </MusicApp>
        ))}
      </MusicAppsGrid>

      {/* Authorization Code Display */}
      <AuthCodeDisplay>
        {deviceFlowService.formatUserCode(state.userCode)}
      </AuthCodeDisplay>

      {/* QR Code Section */}
      <QRCodeSection>
        <QRTitle>Connect with Bose Music App</QRTitle>
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
            Speaker Connected Successfully!
          </SuccessTitle>
          <SuccessMessage>
            Your Bose Smart Speaker is now connected and ready to play your favorite music.
          </SuccessMessage>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {state.tokens.access_token && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <InlineTokenDisplay
                  label="Access Token"
                  token={state.tokens.access_token}
                  tokenType="access"
                  isOIDC={state.tokens.id_token ? true : false}
                  flowKey="device-authorization"
                  defaultMasked={true}
                  allowMaskToggle={true}
                />
              </div>
            )}
            {state.tokens.id_token && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <InlineTokenDisplay
                  label="ID Token"
                  token={state.tokens.id_token}
                  tokenType="id"
                  isOIDC={true}
                  flowKey="device-authorization"
                  defaultMasked={true}
                  allowMaskToggle={true}
                />
              </div>
            )}
            {state.tokens.refresh_token && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <InlineTokenDisplay
                  label="Refresh Token"
                  token={state.tokens.refresh_token}
                  tokenType="refresh"
                  isOIDC={state.tokens.id_token ? true : false}
                  flowKey="device-authorization"
                  defaultMasked={true}
                  allowMaskToggle={true}
                />
              </div>
            )}
          </div>
        </SuccessDisplay>
      )}
    </BoseSpeakerContainer>
  );
};

export default BoseSmartSpeakerDeviceFlow;
