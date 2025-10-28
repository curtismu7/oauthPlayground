// src/components/GasPumpDeviceFlow.tsx
// Gas Pump Style Device Authorization Flow Interface

import React, { useEffect, useState } from 'react';
import { FiCopy, FiExternalLink, FiRefreshCw, FiXCircle, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import { UnifiedTokenDisplayService } from '../services/unifiedTokenDisplayService';

// Kroger Gas Pump Main Container - Red and White Design
const GasPumpContainer = styled.div`
  background: #ffffff;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  position: relative;
  color: #1e293b;
`;

// Kroger Gas Pump Display Screen
const TopScreen = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #dc2626;
  border-radius: 0.25rem;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
  color: #dc2626;
  font-weight: 700;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  position: relative;
`;

const ScreenTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  color: #dc2626;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  letter-spacing: 0.05em;
`;

const ScreenSubtitle = styled.div`
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 1rem;
`;

const EthanolLabel = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: white;
  color: #1e40af;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid #1e40af;
`;

// Main Control Panel - Like the keypad and card reader area
const ControlPanel = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  align-items: start;
`;

// Left Panel - Transaction options
const LeftPanel = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TransactionButton = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active ? '#fbbf24' : 'rgba(255, 255, 255, 0.9)'};
  color: ${props => props.$active ? '#1e40af' : '#374151'};
  border: 2px solid ${props => props.$active ? '#f59e0b' : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #fbbf24;
    color: #1e40af;
    border-color: #f59e0b;
  }
`;

// Center Panel - User Code Display (like the main display on a gas pump)
const CenterPanel = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border: 3px solid #fbbf24;
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(251, 191, 36, 0.3);
`;

const UserCodeLabel = styled.div`
  color: #fbbf24;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const UserCodeDisplay = styled.div`
  background: #000;
  color: #00ff00;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 3rem;
  font-weight: 700;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #00ff00;
  border: 2px solid #00ff00;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3);
`;

const CopyCodeButton = styled.button`
  background: #fbbf24;
  color: #1e40af;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #f59e0b;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

// Right Panel - Card reader area
const RightPanel = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CardReader = styled.div`
  background: #374151;
  border: 2px solid #6b7280;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  position: relative;
  
  &::after {
    content: 'Instructions';
    position: absolute;
    bottom: -1.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.75rem;
    color: #9ca3af;
  }
`;

const CardSlot = styled.div`
  width: 100%;
  height: 2rem;
  background: #1f2937;
  border: 1px solid #4b5563;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
  position: relative;
  
  &::before {
    content: '→';
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
    font-size: 1.2rem;
  }
`;

// Fuel Selection Area - Like the fuel type buttons on a gas pump
const FuelSelectionArea = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FuelButton = styled.button<{ $type: 'regular' | 'special' | 'super' | 'diesel' | 'rec90'; $active?: boolean }>`
  background: ${props => {
    switch (props.$type) {
      case 'regular': return props.$active ? '#10b981' : '#f3f4f6';
      case 'special': return props.$active ? '#ef4444' : '#f3f4f6';
      case 'super': return props.$active ? '#3b82f6' : '#f3f4f6';
      case 'diesel': return props.$active ? '#fbbf24' : '#f3f4f6';
      case 'rec90': return props.$active ? '#8b5cf6' : '#f3f4f6';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => props.$active ? 'white' : '#374151'};
  border: 2px solid ${props => props.$active ? 'currentColor' : '#d1d5db'};
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const FuelLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const FuelPrice = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
`;

const FuelOctane = styled.div`
  font-size: 0.75rem;
  opacity: 0.8;
`;

// QR Code Section - Like a display area on the pump
const QRCodeSection = styled.div`
  background: white;
  border: 3px solid #1e40af;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const QRCodeLabel = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 1rem;
  text-transform: uppercase;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

// Status Display - Like the status indicators on a gas pump
const StatusDisplay = styled.div<{ $status: string }>`
  background: ${props => {
    switch (props.$status) {
      case 'pending': return 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)';
      case 'authorized': return 'linear-gradient(135deg, #dcfce7 0%, #10b981 100%)';
      case 'denied': return 'linear-gradient(135deg, #fecaca 0%, #ef4444 100%)';
      case 'expired': return 'linear-gradient(135deg, #f3f4f6 0%, #6b7280 100%)';
      default: return 'linear-gradient(135deg, #f3f4f6 0%, #6b7280 100%)';
    }
  }};
  border: 2px solid ${props => {
    switch (props.$status) {
      case 'pending': return '#f59e0b';
      case 'authorized': return '#059669';
      case 'denied': return '#dc2626';
      case 'expired': return '#4b5563';
      default: return '#4b5563';
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
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const StatusMessage = styled.div`
  font-size: 0.875rem;
  color: #374151;
`;

// Verification Section - Like additional controls on a gas pump
const VerificationSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const VerificationButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  background: ${props => props.$variant === 'primary' ? '#1e40af' : '#6b7280'};
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${props => props.$variant === 'primary' ? '#1d4ed8' : '#4b5563'};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

// Brand Logo Area - Like the Mobil logo on a gas pump
const BrandArea = styled.div`
  text-align: center;
  margin-top: 1.5rem;
`;

const BrandLogo = styled.div`
  background: white;
  color: #1e40af;
  padding: 1rem 2rem;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 700;
  display: inline-block;
  border: 3px solid #1e40af;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

// Action Buttons
const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: #1e40af;
          color: white;
          &:hover { background: #1d4ed8; transform: translateY(-1px); }
        `;
      case 'secondary':
        return `
          background: #6b7280;
          color: white;
          &:hover { background: #4b5563; transform: translateY(-1px); }
        `;
      case 'success':
        return `
          background: #10b981;
          color: white;
          &:hover { background: #059669; transform: translateY(-1px); }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; transform: translateY(-1px); }
        `;
    }
  }}
`;

interface GasPumpDeviceFlowProps {
  state: DeviceFlowState;
  onStateUpdate: (newState: DeviceFlowState) => void;
  onComplete: (tokens: any) => void;
  onError: (error: string) => void;
}

const GasPumpDeviceFlow: React.FC<GasPumpDeviceFlowProps> = ({
  state,
  onStateUpdate,
  onComplete,
  onError,
}) => {
  const [selectedFuel, setSelectedFuel] = useState<'regular' | 'special' | 'super' | 'diesel' | 'rec90'>('regular');
  const [isPolling, setIsPolling] = useState(false);

  const handleCopyUserCode = () => {
    navigator.clipboard.writeText(state.userCode);
    logger.info('GasPumpDeviceFlow', 'User code copied to clipboard');
  };

  const handleCopyVerificationUri = () => {
    navigator.clipboard.writeText(state.verificationUri);
    logger.info('GasPumpDeviceFlow', 'Verification URI copied to clipboard');
  };

  const handleOpenVerificationUri = () => {
    window.open(state.verificationUriComplete, '_blank');
    logger.info('GasPumpDeviceFlow', 'Verification URI opened in new tab');
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
    <GasPumpContainer>
      {/* Top Screen - Advertisement Area */}
      <TopScreen>
        <EthanolLabel>CONTAINS UP TO 10% ETHANOL</EthanolLabel>
        <ScreenTitle>Device Authorization</ScreenTitle>
        <ScreenSubtitle>Enter the code below on your device to authorize</ScreenSubtitle>
      </TopScreen>

      {/* Main Control Panel */}
      <ControlPanel>
        {/* Left Panel - Transaction Options */}
        <LeftPanel>
          <TransactionButton $active={state.status === 'pending'}>
            📱 QR Code
          </TransactionButton>
          <TransactionButton $active={state.status === 'authorized'}>
            <FiCheckCircle /> Complete
          </TransactionButton>
          <TransactionButton>
            <FiRefreshCw /> Refresh
          </TransactionButton>
        </LeftPanel>

        {/* Center Panel - User Code Display */}
        <CenterPanel>
          <UserCodeLabel>Enter this code on your device</UserCodeLabel>
          <UserCodeDisplay>
            {deviceFlowService.formatUserCode(state.userCode)}
          </UserCodeDisplay>
          <CopyCodeButton onClick={handleCopyUserCode}>
            <FiCopy /> Copy Code
          </CopyCodeButton>
        </CenterPanel>

        {/* Right Panel - Card Reader */}
        <RightPanel>
          <CardReader>
            <CardSlot />
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Insert your device here
            </div>
          </CardReader>
        </RightPanel>
      </ControlPanel>

      {/* Fuel Selection Area */}
      <FuelSelectionArea>
        <FuelButton 
          $type="rec90" 
          $active={selectedFuel === 'rec90'}
          onClick={() => setSelectedFuel('rec90')}
        >
          <FuelLabel>REC 90</FuelLabel>
          <FuelPrice>--</FuelPrice>
          <FuelOctane>90</FuelOctane>
        </FuelButton>
        
        <FuelButton 
          $type="diesel" 
          $active={selectedFuel === 'diesel'}
          onClick={() => setSelectedFuel('diesel')}
        >
          <FuelLabel>Diesel</FuelLabel>
          <FuelPrice>--</FuelPrice>
          <FuelOctane>Diesel</FuelOctane>
        </FuelButton>
        
        <FuelButton 
          $type="regular" 
          $active={selectedFuel === 'regular'}
          onClick={() => setSelectedFuel('regular')}
        >
          <FuelLabel>Regular</FuelLabel>
          <FuelPrice>2.99</FuelPrice>
          <FuelOctane>87</FuelOctane>
        </FuelButton>
        
        <FuelButton 
          $type="special" 
          $active={selectedFuel === 'special'}
          onClick={() => setSelectedFuel('special')}
        >
          <FuelLabel>Special</FuelLabel>
          <FuelPrice>--</FuelPrice>
          <FuelOctane>89</FuelOctane>
        </FuelButton>
        
        <FuelButton 
          $type="super" 
          $active={selectedFuel === 'super'}
          onClick={() => setSelectedFuel('super')}
        >
          <FuelLabel>Super+</FuelLabel>
          <FuelPrice>--</FuelPrice>
          <FuelOctane>93</FuelOctane>
        </FuelButton>
      </FuelSelectionArea>

      {/* QR Code Section */}
      <QRCodeSection>
        <QRCodeLabel>QR Code (for mobile apps)</QRCodeLabel>
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
      </QRCodeSection>

      {/* Status Display */}
      <StatusDisplay $status={state.status}>
        <StatusIcon>{getStatusIcon()}</StatusIcon>
        <StatusText>{getStatusText()}</StatusText>
        <StatusMessage>{getStatusMessage()}</StatusMessage>
      </StatusDisplay>

      {/* Verification Section */}
      <VerificationSection>
        <VerificationButton $variant="secondary" onClick={handleCopyVerificationUri}>
          <FiCopy /> Copy URI
        </VerificationButton>
        <VerificationButton $variant="primary" onClick={handleOpenVerificationUri}>
          <FiExternalLink /> Open Authorization
        </VerificationButton>
      </VerificationSection>

      {/* Success Display */}
      {state.status === 'authorized' && state.tokens && (
        <div style={{ 
          background: 'white', 
          border: '3px solid #10b981', 
          borderRadius: '0.75rem', 
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#10b981', 
            textAlign: 'center',
            marginBottom: '1rem'
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

      {/* Brand Logo */}
      <BrandArea>
        <BrandLogo>
          🔐 OAuth
        </BrandLogo>
      </BrandArea>
    </GasPumpContainer>
  );
};

export default GasPumpDeviceFlow;
