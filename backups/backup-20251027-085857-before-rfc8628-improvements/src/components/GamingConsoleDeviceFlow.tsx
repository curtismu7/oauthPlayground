// src/components/GamingConsoleDeviceFlow.tsx
// Gaming Console Style Device Authorization Flow Interface

import React, { useEffect, useState } from 'react';
import { FiCopy, FiExternalLink, FiRefreshCw, FiXCircle, FiCheckCircle, FiAlertTriangle, FiTv } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import { UnifiedTokenDisplayService } from '../services/unifiedTokenDisplayService';

// Sony PlayStation 5 Console Main Container - Physical PS5 Design
const GamingConsoleContainer = styled.div<{ $authorized?: boolean }>`
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  position: relative;
  color: #1e293b;
`;

// PlayStation 5 Console Header
const ConsoleHeader = styled.div<{ $authorized?: boolean }>`
  background: ${({ $authorized }) => 
    $authorized 
      ? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)' 
      : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
  };
  border: 1px solid ${({ $authorized }) => $authorized ? '#00ff88' : '#3a3a3c'};
  border-radius: 0.25rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  color: ${({ $authorized }) => $authorized ? '#000000' : '#ffffff'};
  font-weight: 600;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
`;

const ConsoleTitle = styled.div<{ $authorized?: boolean }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ $authorized }) => $authorized ? '#000000' : '#0096ff'};
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: ${({ $authorized }) => 
    $authorized 
      ? '0 0 10px rgba(0, 255, 136, 0.5)' 
      : '0 0 10px rgba(0, 150, 255, 0.5)'
  };
  transition: all 0.3s ease;
`;

const ConsoleSubtitle = styled.div<{ $authorized?: boolean }>`
  font-size: 1rem;
  color: ${({ $authorized }) => $authorized ? '#000000' : '#cccccc'};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.3s ease;
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

// PS5 Display Screen - Physical Console Screen
const PS5DisplayScreen = styled.div`
  background: linear-gradient(180deg, #000000 0%, #1a1a1a 100%);
  border-radius: 1rem;
  padding: 0;
  margin-bottom: 1.5rem;
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.5),
    0 0 0 4px #0096ff;
  border: 4px solid #000000;
  overflow: hidden;
  position: relative;
  min-height: 450px;
`;

const PS5Dashboard = styled.div`
  background: linear-gradient(180deg, #1a1a1a 0%, #000000 100%);
  padding: 0;
  min-height: 500px;
  display: flex;
  flex-direction: column;
`;

const PS5NavBar = styled.div`
  background: rgba(0, 0, 0, 0.9);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
`;

const PS5Logo = styled.div`
  font-size: 2rem;
  font-weight: 900;
  color: #0096ff;
  letter-spacing: 0.1em;
  text-shadow: 0 0 30px rgba(0, 150, 255, 0.5);
`;

const ConsoleStatus = styled.div<{ $status: string }>`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $status }) => 
    $status === 'authorized' ? '#00ff88' : $status === 'pending' ? '#f59e0b' : '#999999'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: 1px solid ${({ $status }) => 
    $status === 'authorized' ? '#00ff88' : $status === 'pending' ? '#f59e0b' : 'rgba(255, 255, 255, 0.2)'};
`;

const DashboardContent = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  flex: 1;
`;

const GameSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SectionTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.05em;
`;

const GameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1.5rem;
`;

const GameCard = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 0.5rem;
  padding: 1rem;
  border: 2px solid rgba(0, 150, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: scale(1.05);
    border-color: rgba(0, 150, 255, 0.5);
    box-shadow: 0 8px 24px rgba(0, 150, 255, 0.2);
  }
`;

const GameImage = styled.div`
  width: 100%;
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #0096ff 0%, #0066cc 100%);
  border-radius: 0.25rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const GameLabel = styled.div`
  font-size: 0.875rem;
  color: #999999;
  text-align: center;
`;

const AuthorizationBanner = styled.div`
  background: linear-gradient(135deg, rgba(0, 150, 255, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%);
  border: 2px solid #0096ff;
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
`;

const AuthTitle = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #0096ff;
  margin-bottom: 1rem;
  letter-spacing: 0.05em;
`;

const AuthCode = styled.div`
  background: rgba(0, 0, 0, 0.6);
  color: #f97316;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 3.5rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin: 1.5rem 0;
  letter-spacing: 0.3em;
  text-shadow: 0 0 30px rgba(249, 115, 22, 0.5);
  border: 2px solid rgba(249, 115, 22, 0.3);
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

  const isAuthorized = state.status === 'authorized';

  return (
    <GamingConsoleContainer $authorized={isAuthorized}>
      {/* PS5 Display Screen */}
      <PS5DisplayScreen>
        <PS5Dashboard>
          <PS5NavBar>
            <PS5Logo>PS5</PS5Logo>
            <ConsoleStatus $status={state.status}>
              {state.status === 'authorized' ? 'READY' : state.status === 'pending' ? 'AUTHORIZING' : state.status === 'denied' ? 'DENIED' : 'IDLE'}
            </ConsoleStatus>
          </PS5NavBar>
          
          <DashboardContent>
            {/* Authorization Banner */}
            <AuthorizationBanner>
              <AuthTitle>Device Pairing Required</AuthTitle>
              <AuthCode>
                {deviceFlowService.formatUserCode(state.userCode)}
              </AuthCode>
            </AuthorizationBanner>
            
            {/* Game Library */}
            <GameSection>
              <SectionTitle>Game Library</SectionTitle>
              <GameGrid>
                <GameCard>
                  <GameImage>RPG</GameImage>
                  <GameLabel>RPG</GameLabel>
                </GameCard>
                <GameCard>
                  <GameImage>FPS</GameImage>
                  <GameLabel>FPS</GameLabel>
                </GameCard>
                <GameCard>
                  <GameImage>RACE</GameImage>
                  <GameLabel>Racing</GameLabel>
                </GameCard>
                <GameCard>
                  <GameImage>RTS</GameImage>
                  <GameLabel>Strategy</GameLabel>
                </GameCard>
              </GameGrid>
            </GameSection>
            
            {/* QR Code Section */}
            <GameSection>
              <SectionTitle>Scan QR Code</SectionTitle>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
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
            </GameSection>
          </DashboardContent>
        </PS5Dashboard>
      </PS5DisplayScreen>

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

      {/* Console Base */}
      <ConsoleBase />
    </GamingConsoleContainer>
  );
};

export default GamingConsoleDeviceFlow;
