// src/components/DeviceRegistrationModal.tsx


import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: V9_COLORS.TEXT.GRAY_DARK;
  }
`;

const SuccessIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background: V9_COLORS.BG.SUCCESS;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
`;

const DeviceInfo = styled.div`
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
  min-width: 100px;
`;

const InfoValue = styled.span`
  color: V9_COLORS.TEXT.GRAY_DARK;
  flex: 1;
`;

const DeviceIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: #dbeafe;
  border-radius: 0.375rem;
  color: V9_COLORS.PRIMARY.BLUE;
`;

const StatusBadge = styled.div<{ status: 'active' | 'pending' | 'inactive' }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${(props) => {
		switch (props.status) {
			case 'active':
				return `
          background: V9_COLORS.BG.SUCCESS;
          color: V9_COLORS.PRIMARY.GREEN;
        `;
			case 'pending':
				return `
          background: V9_COLORS.BG.WARNING;
          color: V9_COLORS.PRIMARY.YELLOW_DARK;
        `;
			case 'inactive':
				return `
          background: V9_COLORS.BG.ERROR;
          color: V9_COLORS.PRIMARY.RED_DARK;
        `;
			default:
				return `
          background: #f3f4f6;
          color: V9_COLORS.TEXT.GRAY_DARK;
        `;
		}
	}}
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${(props) => {
		if (props.variant === 'primary') {
			return `
        background: V9_COLORS.PRIMARY.BLUE;
        color: white;
        
        &:hover {
          background: V9_COLORS.PRIMARY.BLUE_DARK;
        }
      `;
		} else {
			return `
        background: #f3f4f6;
        color: V9_COLORS.TEXT.GRAY_DARK;
        
        &:hover {
          background: V9_COLORS.TEXT.GRAY_LIGHTER;
        }
      `;
		}
	}}
`;

interface DeviceRegistrationModalProps {
	isOpen: boolean;
	onClose: () => void;
	deviceData: {
		deviceId: string;
		deviceType: string;
		deviceName: string;
		contactInfo: string;
		status: 'active' | 'pending' | 'inactive';
		registeredAt: string;
	};
	onContinue: () => void;
}

const DeviceRegistrationModal: React.FC<DeviceRegistrationModalProps> = ({
	isOpen,
	onClose,
	deviceData,
	onContinue,
}) => {
	if (!isOpen) return null;

	const getDeviceIcon = (deviceType: string) => {
		switch (deviceType.toLowerCase()) {
			case 'sms':
				return <span style={{ fontSize: '16px' }}>📱</span>;
			case 'email':
				return <span style={{ fontSize: '16px' }}>📧</span>;
			case 'totp':
				return <span style={{ fontSize: '16px' }}>🛡️</span>;
			default:
				return <span style={{ fontSize: '16px' }}>📱</span>;
		}
	};

	const formatContactInfo = (contactInfo: string, deviceType: string) => {
		if (deviceType.toLowerCase() === 'sms' && contactInfo.startsWith('+')) {
			// Format phone number nicely
			const phone = contactInfo.substring(1); // Remove +
			if (phone.length === 11 && phone.startsWith('1')) {
				// US number: +1 (555) 123-4567
				return `+1 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7)}`;
			}
		}
		return contactInfo;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContainer onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<ModalTitle>
						<span style={{ fontSize: 24, color: 'V9_COLORS.PRIMARY.GREEN' }}>✅</span>
						Device Registered Successfully
					</ModalTitle>
					<CloseButton onClick={onClose}>
						<span style={{ fontSize: '20px' }}>❌</span>
					</CloseButton>
				</ModalHeader>

				<SuccessIcon>
					<span style={{ fontSize: 32, color: 'V9_COLORS.PRIMARY.GREEN' }}>✅</span>
				</SuccessIcon>

				<DeviceInfo>
					<InfoRow>
						<DeviceIcon>{getDeviceIcon(deviceData.deviceType)}</DeviceIcon>
						<InfoLabel>Device Type:</InfoLabel>
						<InfoValue>{deviceData.deviceType.toUpperCase()}</InfoValue>
					</InfoRow>

					<InfoRow>
						<InfoLabel>Device Name:</InfoLabel>
						<InfoValue>{deviceData.deviceName}</InfoValue>
					</InfoRow>

					<InfoRow>
						<InfoLabel>Contact Info:</InfoLabel>
						<InfoValue>
							{formatContactInfo(deviceData.contactInfo, deviceData.deviceType)}
						</InfoValue>
					</InfoRow>

					<InfoRow>
						<InfoLabel>Status:</InfoLabel>
						<InfoValue>
							<StatusBadge status={deviceData.status}>{deviceData.status}</StatusBadge>
						</InfoValue>
					</InfoRow>

					<InfoRow>
						<InfoLabel>Registered:</InfoLabel>
						<InfoValue>{formatDate(deviceData.registeredAt)}</InfoValue>
					</InfoRow>

					<InfoRow>
						<InfoLabel>Device ID:</InfoLabel>
						<InfoValue
							style={{
								fontFamily: 'monospace',
								fontSize: '0.75rem',
								color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
							}}
						>
							{deviceData.deviceId}
						</InfoValue>
					</InfoRow>
				</DeviceInfo>

				<ModalActions>
					<Button variant="secondary" onClick={onClose}>
						Close
					</Button>
					<Button variant="primary" onClick={onContinue}>
						Continue to MFA Challenge
					</Button>
				</ModalActions>
			</ModalContainer>
		</ModalOverlay>
	);
};

export default DeviceRegistrationModal;
