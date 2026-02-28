// src/v8/components/DeviceCreationSuccessModalV8.tsx
// Device Creation Success Modal - Shows device info for all flow types

import React from 'react';
import {
	FiCheckCircle,
	FiKey,
	FiMail,
	FiMessageSquare,
	FiPhone,
	FiShield,
	FiSmartphone,
	FiX,
} from '@icons';
import styled from 'styled-components';
import type { DeviceType } from '../flows/shared/MFATypes';
import { getDeviceTypeDisplay } from '../flows/shared/mfaSuccessPageServiceV8';

const _MODULE_TAG = '[DeviceCreationSuccessModalV8]';

// V8 Styled Components
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

const ModalContent = styled.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	max-width: 500px;
	width: 90%;
	max-height: 80vh;
	overflow-y: auto;
`;

const ModalHeader = styled.div`
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	padding: 1.5rem;
	border-radius: 1rem 1rem 0 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const ModalTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CloseButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: none;
	border-radius: 0.5rem;
	color: white;
	cursor: pointer;
	padding: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.3);
	}
`;

const ModalBody = styled.div`
	padding: 2rem;
`;

const SuccessIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 4rem;
	height: 4rem;
	background: #f0fdf4;
	border: 2px solid #10b981;
	border-radius: 50%;
	margin: 0 auto 1.5rem;
	color: #10b981;
	font-size: 2rem;
`;

const SuccessMessage = styled.div`
	text-align: center;
	margin-bottom: 2rem;
`;

const SuccessTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 0.5rem 0;
`;

const SuccessDescription = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0;
	line-height: 1.5;
`;

const DeviceInfo = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

const DeviceInfoTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	color: #374151;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const DeviceInfoRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 0;
	border-bottom: 1px solid #e5e7eb;

	&:last-child {
		border-bottom: none;
	}
`;

const DeviceInfoLabel = styled.span`
	font-size: 0.875rem;
	font-weight: 500;
	color: #6b7280;
`;

const DeviceInfoValue = styled.span`
	font-size: 0.875rem;
	font-weight: 600;
	color: #1f2937;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const StatusBadge = styled.span<{ $status: 'ACTIVE' | 'ACTIVATION_REQUIRED' }>`
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	background: ${({ $status }) => ($status === 'ACTIVE' ? '#f0fdf4' : '#fef3c7')};
	color: ${({ $status }) => ($status === 'ACTIVE' ? '#166534' : '#92400e')};
	border: 1px solid ${({ $status }) => ($status === 'ACTIVE' ? '#bbf7d0' : '#fde68a')};
`;

const NextSteps = styled.div`
	background: #eff6ff;
	border: 1px solid #dbeafe;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

const NextStepsTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	color: #1e40af;
	margin: 0 0 0.75rem 0;
`;

const NextStepsList = styled.ul`
	margin: 0;
	padding-left: 1.25rem;
	color: #3730a3;
	font-size: 0.875rem;
	line-height: 1.5;

	li {
		margin-bottom: 0.5rem;
		&:last-child {
			margin-bottom: 0;
		}
	}
`;

const ActionButton = styled.button`
	width: 100%;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	background: #10b981;
	color: white;

	&:hover {
		background: #059669;
	}
`;

export interface DeviceCreationSuccessModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	deviceInfo: {
		deviceId: string;
		deviceType: DeviceType;
		deviceStatus: 'ACTIVE' | 'ACTIVATION_REQUIRED';
		deviceName?: string;
		nickname?: string;
		username?: string;
		userId?: string;
		environmentId?: string;
		email?: string;
		phone?: string;
		createdAt?: string;
		registrationFlowType?: 'admin' | 'user';
	};
}

export const DeviceCreationSuccessModalV8: React.FC<DeviceCreationSuccessModalV8Props> = ({
	isOpen,
	onClose,
	deviceInfo,
}) => {
	if (!isOpen) return null;

	const getDeviceIcon = (deviceType: DeviceType) => {
		switch (deviceType) {
			case 'EMAIL':
				return <FiMail />;
			case 'SMS':
			case 'VOICE':
				return <FiPhone />;
			case 'TOTP':
				return <FiKey />;
			case 'FIDO2':
				return <FiShield />;
			case 'WHATSAPP':
				return <FiMessageSquare />;
			case 'MOBILE':
			case 'OATH_TOKEN':
				return <FiSmartphone />;
			default:
				return <FiShield />;
		}
	};

	const getContactInfo = () => {
		if (deviceInfo.email) return deviceInfo.email;
		if (deviceInfo.phone) return deviceInfo.phone;
		return 'N/A';
	};

	const getNextSteps = () => {
		if (deviceInfo.deviceStatus === 'ACTIVE') {
			return [
				'Device is ready for MFA challenges',
				'Users can authenticate using this device immediately',
				'Device will appear in user device selection lists',
			];
		} else {
			return [
				'OTP has been automatically sent to the device',
				'User must enter the OTP to activate the device',
				'Device will be ready for use after successful activation',
			];
		}
	};

	return (
		<ModalOverlay>
			<ModalContent>
				<ModalHeader>
					<ModalTitle>
						<FiCheckCircle />
						Device Created Successfully
					</ModalTitle>
					<CloseButton onClick={onClose}>
						<FiX />
					</CloseButton>
				</ModalHeader>

				<ModalBody>
					<SuccessIcon>
						<FiCheckCircle />
					</SuccessIcon>

					<SuccessMessage>
						<SuccessTitle>
							{getDeviceTypeDisplay(deviceInfo.deviceType)} Device Created
						</SuccessTitle>
						<SuccessDescription>
							{deviceInfo.deviceStatus === 'ACTIVE'
								? 'Your device has been registered and is ready to use.'
								: 'Your device has been registered and requires activation.'}
						</SuccessDescription>
					</SuccessMessage>

					<DeviceInfo>
						<DeviceInfoTitle>
							{getDeviceIcon(deviceInfo.deviceType)}
							Device Information
						</DeviceInfoTitle>

						<DeviceInfoRow>
							<DeviceInfoLabel>Device ID:</DeviceInfoLabel>
							<DeviceInfoValue>{deviceInfo.deviceId}</DeviceInfoValue>
						</DeviceInfoRow>

						<DeviceInfoRow>
							<DeviceInfoLabel>Device Type:</DeviceInfoLabel>
							<DeviceInfoValue>{getDeviceTypeDisplay(deviceInfo.deviceType)}</DeviceInfoValue>
						</DeviceInfoRow>

						<DeviceInfoRow>
							<DeviceInfoLabel>Status:</DeviceInfoLabel>
							<DeviceInfoValue>
								<StatusBadge $status={deviceInfo.deviceStatus}>
									{deviceInfo.deviceStatus}
								</StatusBadge>
							</DeviceInfoValue>
						</DeviceInfoRow>

						{deviceInfo.nickname && (
							<DeviceInfoRow>
								<DeviceInfoLabel>Nickname:</DeviceInfoLabel>
								<DeviceInfoValue>{deviceInfo.nickname}</DeviceInfoValue>
							</DeviceInfoRow>
						)}

						{deviceInfo.username && (
							<DeviceInfoRow>
								<DeviceInfoLabel>Username:</DeviceInfoLabel>
								<DeviceInfoValue>{deviceInfo.username}</DeviceInfoValue>
							</DeviceInfoRow>
						)}

						{(deviceInfo.email || deviceInfo.phone) && (
							<DeviceInfoRow>
								<DeviceInfoLabel>Contact:</DeviceInfoLabel>
								<DeviceInfoValue>{getContactInfo()}</DeviceInfoValue>
							</DeviceInfoRow>
						)}

						{deviceInfo.environmentId && (
							<DeviceInfoRow>
								<DeviceInfoLabel>Environment ID:</DeviceInfoLabel>
								<DeviceInfoValue>{deviceInfo.environmentId}</DeviceInfoValue>
							</DeviceInfoRow>
						)}

						{deviceInfo.createdAt && (
							<DeviceInfoRow>
								<DeviceInfoLabel>Created:</DeviceInfoLabel>
								<DeviceInfoValue>{new Date(deviceInfo.createdAt).toLocaleString()}</DeviceInfoValue>
							</DeviceInfoRow>
						)}

						{deviceInfo.registrationFlowType && (
							<DeviceInfoRow>
								<DeviceInfoLabel>Flow Type:</DeviceInfoLabel>
								<DeviceInfoValue>
									{deviceInfo.registrationFlowType === 'admin' ? 'Admin Flow' : 'User Flow'}
								</DeviceInfoValue>
							</DeviceInfoRow>
						)}
					</DeviceInfo>

					<NextSteps>
						<NextStepsTitle>What's Next?</NextStepsTitle>
						<NextStepsList>
							{getNextSteps().map((step, index) => (
								<li key={index}>{step}</li>
							))}
						</NextStepsList>
					</NextSteps>

					<ActionButton onClick={onClose}>
						{deviceInfo.deviceStatus === 'ACTIVE' ? 'Continue' : 'Proceed to Activation'}
					</ActionButton>
				</ModalBody>
			</ModalContent>
		</ModalOverlay>
	);
};
