// src/components/POSTerminalDeviceFlow.tsx
// POS Terminal Style Device Authorization Flow Interface

import React from 'react';
import { FiCopy, FiExternalLink, FiRefreshCw, FiXCircle, FiCheckCircle, FiAlertTriangle, FiCreditCard, FiDollarSign, FiShoppingCart, FiPlus, FiX, FiFileText } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import JSONHighlighter from './JSONHighlighter';

// Square POS Terminal Main Container - Authentic Square Design
const POSTerminalContainer = styled.div`
  background: #ffffff;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  position: relative;
  color: #1e293b;
`;

// POS Header
const POSHeader = styled.div`
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  border: 2px solid #34d399;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
`;

const POSTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #34d399;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(52, 211, 153, 0.5);
`;

const POSSubtitle = styled.div`
  font-size: 1rem;
  color: #6ee7b7;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// Payment Status Indicators
const PaymentStatusIndicators = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const PaymentStatusIndicator = styled.div<{ $active: boolean; $color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${props => props.$active ? props.$color : '#374151'};
  box-shadow: ${props => props.$active ? `0 0 20px ${props.$color}` : 'none'};
  animation: ${props => props.$active ? 'paymentPulse 2s infinite' : 'none'};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.$active ? '#ffffff' : 'transparent'};
    animation: ${props => props.$active ? 'innerPulse 1.5s infinite' : 'none'};
  }
  
  @keyframes paymentPulse {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.7; 
      transform: scale(1.1);
    }
  }
  
  @keyframes innerPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

// POS Display Screen
const POSDisplayScreen = styled.div`
  background: linear-gradient(135deg, #000000 0%, #1e293b 100%);
  border: 3px solid #34d399;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(52, 211, 153, 0.2);
`;

const ScreenLabel = styled.div`
  color: #34d399;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const UserCodeDisplay = styled.div`
  background: #000000;
  color: #f59e0b;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #f59e0b;
  border: 2px solid #f59e0b;
  box-shadow: 
    inset 0 0 20px rgba(245, 158, 11, 0.2),
    0 0 20px rgba(245, 158, 11, 0.3);
`;

// QR Code Section
const QRCodeSection = styled.div`
  background: #1e293b;
  border: 2px solid #34d399;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const QRCodeLabel = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #34d399;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

// POS Control Panel
const POSControlPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const POSControlButton = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'danger' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return '#34d399';
      case 'secondary': return '#374151';
      case 'success': return '#f59e0b';
      case 'danger': return '#ef4444';
      default: return '#374151';
    }
  }};
  color: white;
  border: 2px solid ${props => {
    switch (props.$variant) {
      case 'primary': return '#10b981';
      case 'secondary': return '#4b5563';
      case 'success': return '#d97706';
      case 'danger': return '#dc2626';
      default: return '#4b5563';
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
      case 'pending': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'authorized': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'denied': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'expired': return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
      default: return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  }};
  border: 2px solid ${props => {
    switch (props.$status) {
      case 'pending': return '#d97706';
      case 'authorized': return '#d97706';
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
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusMessage = styled.div`
  font-size: 0.875rem;
  color: #ffffff;
`;

// POS Base
const POSBase = styled.div`
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #34d399;
`;

interface POSTerminalDeviceFlowProps {
  state: DeviceFlowState;
  onStateUpdate: (newState: DeviceFlowState) => void;
  onComplete: (tokens: any) => void;
  onError: (error: string) => void;
}

const POSTerminalDeviceFlow: React.FC<POSTerminalDeviceFlowProps> = ({
  state,
  onStateUpdate,
  onComplete,
  onError,
}) => {
  const handleCopyUserCode = () => {
    navigator.clipboard.writeText(state.userCode);
    logger.info('POSTerminalDeviceFlow', 'User code copied to clipboard');
  };

  const handleCopyVerificationUri = () => {
    navigator.clipboard.writeText(state.verificationUri);
    logger.info('POSTerminalDeviceFlow', 'Verification URI copied to clipboard');
  };

  const handleOpenVerificationUri = () => {
    window.open(state.verificationUriComplete, '_blank');
    logger.info('POSTerminalDeviceFlow', 'Verification URI opened in new tab');
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
        return 'AWAITING AUTHORIZATION';
      case 'authorized':
        return 'TERMINAL AUTHORIZED';
      case 'denied':
        return 'AUTHORIZATION DENIED';
      case 'expired':
        return 'SESSION EXPIRED';
      default:
        return 'UNKNOWN STATUS';
    }
  };

  const getStatusMessage = () => {
    return deviceFlowService.getStatusMessage(state);
  };

  return (
    <POSTerminalContainer>
      {/* POS Header */}
      <POSHeader>
        <POSTitle>
          <FiCreditCard style={{ marginRight: '0.5rem' }} />
          POS Terminal
        </POSTitle>
        <POSSubtitle>Secure Payment Authorization System</POSSubtitle>
      </POSHeader>

      {/* Payment Status Indicators */}
      <PaymentStatusIndicators>
        <PaymentStatusIndicator $active={state.status === 'pending'} $color="#f59e0b" />
        <PaymentStatusIndicator $active={state.status === 'authorized'} $color="#f59e0b" />
        <PaymentStatusIndicator $active={state.status === 'denied'} $color="#ef4444" />
        <PaymentStatusIndicator $active={state.status === 'expired'} $color="#6b7280" />
      </PaymentStatusIndicators>

      {/* POS Display Screen */}
      <POSDisplayScreen>
        <ScreenLabel>Payment Authorization Code</ScreenLabel>
        <UserCodeDisplay>
          {deviceFlowService.formatUserCode(state.userCode)}
        </UserCodeDisplay>
      </POSDisplayScreen>

      {/* QR Code Section */}
      <QRCodeSection>
        <QRCodeLabel>
          <FiDollarSign style={{ marginRight: '0.5rem' }} />
          Payment Scanner
        </QRCodeLabel>
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

      {/* POS Control Panel */}
      <POSControlPanel>
        <POSControlButton $variant="secondary" onClick={handleCopyUserCode}>
          <FiCopy /> Copy Code
        </POSControlButton>
        <POSControlButton $variant="secondary" onClick={handleCopyVerificationUri}>
          <FiCopy /> Copy URI
        </POSControlButton>
        <POSControlButton $variant="primary" onClick={handleOpenVerificationUri}>
          <FiExternalLink /> Authorize
        </POSControlButton>
      </POSControlPanel>

      {/* Status Display */}
      <StatusDisplay $status={state.status}>
        <StatusIcon>{getStatusIcon()}</StatusIcon>
        <StatusText>{getStatusText()}</StatusText>
        <StatusMessage>{getStatusMessage()}</StatusMessage>
      </StatusDisplay>

      {/* Success Display - Realistic POS Terminal Interface */}
      {state.status === 'authorized' && state.tokens && (
        <div style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
          border: '3px solid #f97316', 
          borderRadius: '1rem', 
          padding: '2rem',
          marginTop: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          color: '#1e293b'
        }}>
          {/* POS Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid #cbd5e1'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.25rem'
              }}>
                💳
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>
                  Square Point of Sale
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Terminal #001 • Register Active
                </div>
              </div>
            </div>
            <div style={{
              background: '#10b981',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              Online
            </div>
          </div>

          {/* Current Transaction */}
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '1.25rem' }}>🛒</div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Current Sale</h3>
            </div>
            
            {/* Cart Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
                    Large Coffee
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Hot • Extra shot
                  </div>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
                  $4.50
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
                    Blueberry Muffin
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Fresh baked
                  </div>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
                  $3.25
                </div>
              </div>
            </div>
            
            {/* Totals */}
            <div style={{
              borderTop: '2px solid #e2e8f0',
              paddingTop: '1rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Subtotal</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>$7.75</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Tax (8.5%)</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>$0.66</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: '#f97316',
                borderRadius: '0.5rem',
                color: 'white'
              }}>
                <span style={{ fontSize: '1rem', fontWeight: '700' }}>Total</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>$8.41</span>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <button style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '2rem' }}>💳</div>
              <div>Card Payment</div>
            </button>
            
            <button style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '2rem' }}>📱</div>
              <div>Mobile Pay</div>
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem'
          }}>
            <button style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <FiPlus /> Add Item
            </button>
            <button style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <FiX /> Void
            </button>
            <button style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '1rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <FiFileText /> Receipt
            </button>
          </div>
        </div>
      )}

      {/* POS Base */}
      <POSBase />
    </POSTerminalContainer>
  );
};

export default POSTerminalDeviceFlow;
