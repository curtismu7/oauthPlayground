// src/components/DeviceDisplayTemplate.tsx
// Standardized Device Display Template - Based on Airport Kiosk Layout

import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import styled from 'styled-components';

// Main Device Container
const DeviceContainer = styled.div`
  background: V9_COLORS.TEXT.WHITE;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  position: relative;
  color: #1e293b;
`;

// Device Display Screen
const DisplayScreen = styled.div`
  background: linear-gradient(180deg, V9_COLORS.BG.GRAY_LIGHT 0%, V9_COLORS.TEXT.WHITE 100%);
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
  background: linear-gradient(90deg, ${(props) => props.$brandColor} 0%, ${(props) => props.$brandColor}aa 100%);
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
  color: V9_COLORS.TEXT.WHITE;
`;

const BrandText = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: V9_COLORS.TEXT.WHITE;
`;

const StatusBadge = styled.div<{ $status: string }>`
  background: ${(props) => {
		switch (props.$status) {
			case 'authorized':
				return '#10b981';
			case 'pending':
				return '#f59e0b';
			case 'denied':
				return '#ef4444';
			default:
				return '#6b7280';
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
  border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const InfoLabel = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
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
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.5rem;
  text-align: center;
`;

const AuthCodeLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
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
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.5rem;
  text-align: center;
`;

const QRLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
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
        background: V9_COLORS.PRIMARY.BLUE;
        color: white;
        &:hover {
          background: V9_COLORS.PRIMARY.BLUE_DARK;
        }
      `
			: `
        background: #f3f4f6;
        color: V9_COLORS.TEXT.GRAY_DARK;
        &:hover {
          background: V9_COLORS.TEXT.GRAY_LIGHTER;
        }
      `}
`;

// Status Message (below everything)
const StatusMessage = styled.div<{ $status: string }>`
  background: ${(props) => {
		switch (props.$status) {
			case 'authorized':
				return '#ecfdf5';
			case 'pending':
				return '#fef3c7';
			case 'denied':
				return '#ef4444';
			default:
				return '#f3f4f6';
		}
	}};
  border: 2px solid ${(props) => {
		switch (props.$status) {
			case 'authorized':
				return '#10b981';
			case 'pending':
				return '#f59e0b';
			case 'denied':
				return '#ef4444';
			default:
				return '#6b7280';
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
  color: ${(props) => {
		switch (props.$status) {
			case 'authorized':
				return '#10b981';
			case 'pending':
				return '#f59e0b';
			case 'denied':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	}};
`;

const StatusText = styled.div`
  flex: 1;
`;

const StatusTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin-bottom: 0.5rem;
`;

const StatusDescription = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
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
						{status === 'authorized'
							? 'READY'
							: status === 'pending'
								? 'PROCESSING'
								: status === 'denied'
									? 'DENIED'
									: 'IDLE'}
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
								bgColor="V9_COLORS.TEXT.WHITE"
								fgColor="V9_COLORS.TEXT.BLACK"
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
						<span>📋</span> Copy Code
					</ActionButton>
				)}
				{onCopyURI && (
					<ActionButton $variant="secondary" onClick={onCopyURI}>
						<span>📋</span> Copy URI
					</ActionButton>
				)}
				{onOpenURI && (
					<ActionButton $variant="primary" onClick={onOpenURI}>
						<span>🔗</span> Open in Browser
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
