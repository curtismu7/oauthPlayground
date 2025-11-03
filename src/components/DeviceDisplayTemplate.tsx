// src/components/DeviceDisplayTemplate.tsx
// Standardized Device Display Template - Based on Airport Kiosk Layout
import React from 'react';
import styled from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import { FiCopy, FiExternalLink } from 'react-icons/fi';

// Main Device Container
const DeviceContainer = styled.div`
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  position: relative;
  color: #1e293b;
`;

// Device Display Screen
const DisplayScreen = styled.div`
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border-radius: 0.75rem;
  padding: 0;
  margin: 1rem 0;
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.1),
    0 0 0 2px #1e293b;
  border: 2px solid #cbd5e1;
  overflow: hidden;
  position: relative;
  min-height: 300px;
`;

// Device Header/Brand Bar
const DeviceBrandBar = styled.div<{ $brandColor: string }>`
  background: linear-gradient(90deg, ${props => props.$brandColor} 0%, ${props => props.$brandColor}aa 100%);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const BrandLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #ffffff;
`;

const BrandText = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #ffffff;
`;

const StatusBadge = styled.div<{ $status: string }>`
  background: ${props => {
    switch (props.$status) {
      case 'authorized': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'denied': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

// Device Content Area
const DeviceContent = styled.div`
  padding: 1.5rem;
`;

const DeviceInfoSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
`;

const InfoLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
`;

const InfoValue = styled.div`
  font-size: 0.875rem;
  color: #1e293b;
  font-weight: 600;
`;

// Authorization Code Display (inside device)
const AuthCodeSection = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  text-align: center;
`;

const AuthCodeLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
`;

const AuthCodeDisplay = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.1em;
  padding: 0.75rem;
  background: white;
  border-radius: 0.375rem;
`;

// QR Code Section (inside device display)
const QRSectionInline = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  text-align: center;
`;

const QRLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
`;

// Action Buttons (below device)
const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${({ $variant }) => 
    $variant === 'primary' 
      ? `
        background: #3b82f6;
        color: white;
        &:hover {
          background: #2563eb;
        }
      `
      : `
        background: #f3f4f6;
        color: #374151;
        &:hover {
          background: #e5e7eb;
        }
      `
  }
`;

// Status Message (below everything)
const StatusMessage = styled.div<{ $status: string }>`
  background: ${props => {
    switch (props.$status) {
      case 'authorized': return '#dcfce7';
      case 'pending': return '#fef3c7';
      case 'denied': return '#fecaca';
      default: return '#f3f4f6';
    }
  }};
  border: 2px solid ${props => {
    switch (props.$status) {
      case 'authorized': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'denied': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  border-radius: 0.75rem;
  padding: 1rem;
  margin-top: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const StatusIcon = styled.div<{ $status: string }>`
  font-size: 1.5rem;
  color: ${props => {
    switch (props.$status) {
      case 'authorized': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'denied': return '#ef4444';
      default: return '#6b7280';
    }
  }};
`;

const StatusText = styled.div`
  flex: 1;
`;

const StatusTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
`;

const StatusDescription = styled.div`
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
`;

interface DeviceDisplayTemplateProps {
  // Branding
  brandName: string;
  brandIcon?: string;
  brandColor: string;
  
  // Device Info
  deviceInfo: Array<{ label: string; value: string }>;
  
  // Authorization
  authorizationCode: string;
  showQRCode?: boolean;
  qrCodeValue?: string;
  
  // Status
  status: 'pending' | 'authorized' | 'denied' | 'expired';
  statusIcon: React.ReactNode;
  statusTitle: string;
  statusDescription: string;
  
  // Actions
  onCopyCode?: () => void;
  onCopyURI?: () => void;
  onOpenURI?: () => void;
  
  // Custom content
  customContent?: React.ReactNode;
}

export const DeviceDisplayTemplate: React.FC<DeviceDisplayTemplateProps> = ({
  brandName,
  brandIcon,
  brandColor,
  deviceInfo,
  authorizationCode,
  showQRCode = true,
  qrCodeValue,
  status,
  statusIcon,
  statusTitle,
  statusDescription,
  onCopyCode,
  onCopyURI,
  onOpenURI,
  customContent,
}) => {
  return (
    <DeviceContainer>
      {/* Device Display Screen */}
      <DisplayScreen>
        {/* Brand Bar */}
        <DeviceBrandBar $brandColor={brandColor}>
          <BrandLogo>
            {brandIcon && <span style={{ fontSize: '1.5rem' }}>{brandIcon}</span>}
            <BrandText>{brandName}</BrandText>
          </BrandLogo>
          <StatusBadge $status={status}>
            {status === 'authorized' ? 'READY' : status === 'pending' ? 'PROCESSING' : status === 'denied' ? 'DENIED' : 'IDLE'}
          </StatusBadge>
        </DeviceBrandBar>

        {/* Device Content */}
        <DeviceContent>
          {/* Device Info Section */}
          {deviceInfo.length > 0 && (
            <DeviceInfoSection>
              <SectionTitle>Device Information</SectionTitle>
              {deviceInfo.map((info, index) => (
                <InfoRow key={index}>
                  <InfoLabel>{info.label}</InfoLabel>
                  <InfoValue>{info.value}</InfoValue>
                </InfoRow>
              ))}
            </DeviceInfoSection>
          )}

          {/* Authorization Code */}
          <AuthCodeSection>
            <AuthCodeLabel>Authorization Code</AuthCodeLabel>
            <AuthCodeDisplay>{authorizationCode}</AuthCodeDisplay>
          </AuthCodeSection>

          {/* QR Code (optional, inline) */}
          {showQRCode && qrCodeValue && (
            <QRSectionInline>
              <QRLabel>Scan QR Code</QRLabel>
              <QRCodeSVG
                value={qrCodeValue}
                size={100}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
                includeMargin={true}
              />
            </QRSectionInline>
          )}

          {/* Custom Content */}
          {customContent}
        </DeviceContent>
      </DisplayScreen>

      {/* Action Buttons */}
      <ActionButtons>
        {onCopyCode && (
          <ActionButton $variant="secondary" onClick={onCopyCode}>
            <FiCopy /> Copy Code
          </ActionButton>
        )}
        {onCopyURI && (
          <ActionButton $variant="secondary" onClick={onCopyURI}>
            <FiCopy /> Copy URI
          </ActionButton>
        )}
        {onOpenURI && (
          <ActionButton $variant="primary" onClick={onOpenURI}>
            <FiExternalLink /> Open in Browser
          </ActionButton>
        )}
      </ActionButtons>

      {/* Status Message */}
      <StatusMessage $status={status}>
        <StatusIcon $status={status}>{statusIcon}</StatusIcon>
        <StatusText>
          <StatusTitle>{statusTitle}</StatusTitle>
          <StatusDescription>{statusDescription}</StatusDescription>
        </StatusText>
      </StatusMessage>
    </DeviceContainer>
  );
};

export default DeviceDisplayTemplate;

