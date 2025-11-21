// src/components/IndustrialIoTControllerDeviceFlow.tsx
// Industrial IoT Controller Style Device Authorization Flow Interface

import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiRefreshCw,
	FiSettings,
	FiXCircle,
} from 'react-icons/fi';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import JSONHighlighter from './JSONHighlighter';

// Industrial IoT Controller Main Container - Metallic gray with industrial design
const IndustrialContainer = styled.div`
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  position: relative;
  color: #1e293b;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.02) 50%, transparent 70%);
    pointer-events: none;
  }
`;

// Control Panel Header
const ControlPanelHeader = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);
  border: 2px solid #666666;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const PanelTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const PanelSubtitle = styled.div`
  font-size: 0.875rem;
  color: #cccccc;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// Status Indicators
const StatusIndicators = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const StatusIndicator = styled.div<{ $active: boolean; $color: string }>`
  background: ${(props) => (props.$active ? props.$color : '#333333')};
  color: ${(props) => (props.$active ? '#ffffff' : '#666666')};
  border: 2px solid ${(props) => (props.$active ? props.$color : '#555555')};
  border-radius: 0.25rem;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
  min-width: 80px;
`;

// Main Display Area
const MainDisplay = styled.div`
  background: #000000;
  border: 3px solid #666666;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
`;

const DisplayLabel = styled.div`
  color: #00ff00;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const UserCodeDisplay = styled.div`
  background: #000000;
  color: #00ff00;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2rem;
  font-weight: 700;
  padding: 1rem;
  border-radius: 0.25rem;
  margin-bottom: 1rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #00ff00;
  border: 1px solid #00ff00;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3);
`;

// QR Code Section
const QRCodeSection = styled.div`
  background: #1a1a1a;
  border: 2px solid #666666;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const QRCodeLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
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
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ControlButton = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' }>`
  background: ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return '#0066cc';
			case 'secondary':
				return '#404040';
			case 'danger':
				return '#cc0000';
			default:
				return '#404040';
		}
	}};
  color: white;
  border: 2px solid ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return '#0052a3';
			case 'secondary':
				return '#555555';
			case 'danger':
				return '#990000';
			default:
				return '#555555';
		}
	}};
  border-radius: 0.25rem;
  padding: 0.75rem;
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
  
  &:hover {
    background: ${(props) => {
			switch (props.$variant) {
				case 'primary':
					return '#0052a3';
				case 'secondary':
					return '#555555';
				case 'danger':
					return '#990000';
				default:
					return '#555555';
			}
		}};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
`;

// System Status
const SystemStatus = styled.div<{ $status: string }>`
  background: ${(props) => {
		switch (props.$status) {
			case 'pending':
				return 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)';
			case 'authorized':
				return 'linear-gradient(135deg, #00ff00 0%, #32cd32 100%)';
			case 'denied':
				return 'linear-gradient(135deg, #ff0000 0%, #dc143c 100%)';
			case 'expired':
				return 'linear-gradient(135deg, #666666 0%, #404040 100%)';
			default:
				return 'linear-gradient(135deg, #666666 0%, #404040 100%)';
		}
	}};
  border: 2px solid ${(props) => {
		switch (props.$status) {
			case 'pending':
				return '#ff8c00';
			case 'authorized':
				return '#32cd32';
			case 'denied':
				return '#dc143c';
			case 'expired':
				return '#404040';
			default:
				return '#404040';
		}
	}};
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const StatusIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`;

const StatusText = styled.div`
  font-size: 1rem;
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

// Industrial Labels
const IndustrialLabel = styled.div`
  background: #1a1a1a;
  color: #cccccc;
  border: 1px solid #666666;
  border-radius: 0.25rem;
  padding: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-align: center;
  margin-bottom: 0.5rem;
`;

interface IndustrialIoTControllerDeviceFlowProps {
	state: DeviceFlowState;
	onStateUpdate: (newState: DeviceFlowState) => void;
	onComplete: (tokens: any) => void;
	onError: (error: string) => void;
}

const IndustrialIoTControllerDeviceFlow: React.FC<IndustrialIoTControllerDeviceFlowProps> = ({
	state,
	onStateUpdate,
	onComplete,
	onError,
}) => {
	const handleCopyUserCode = () => {
		navigator.clipboard.writeText(state.userCode);
		logger.info('IndustrialIoTControllerDeviceFlow', 'User code copied to clipboard');
	};

	const handleCopyVerificationUri = () => {
		navigator.clipboard.writeText(state.verificationUri);
		logger.info('IndustrialIoTControllerDeviceFlow', 'Verification URI copied to clipboard');
	};

	const handleOpenVerificationUri = () => {
		window.open(state.verificationUriComplete, '_blank');
		logger.info('IndustrialIoTControllerDeviceFlow', 'Verification URI opened in new tab');
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
		<IndustrialContainer>
			{/* Control Panel Header */}
			<ControlPanelHeader>
				<PanelTitle>Industrial IoT Controller</PanelTitle>
				<PanelSubtitle>Device Authorization System</PanelSubtitle>
			</ControlPanelHeader>

			{/* Status Indicators */}
			<StatusIndicators>
				<StatusIndicator $active={state.status === 'pending'} $color="#ffa500">
					Pending
				</StatusIndicator>
				<StatusIndicator $active={state.status === 'authorized'} $color="#00ff00">
					Authorized
				</StatusIndicator>
				<StatusIndicator $active={state.status === 'denied'} $color="#ff0000">
					Denied
				</StatusIndicator>
				<StatusIndicator $active={state.status === 'expired'} $color="#666666">
					Expired
				</StatusIndicator>
			</StatusIndicators>

			{/* Main Display */}
			<MainDisplay>
				<DisplayLabel>Authorization Code</DisplayLabel>
				<UserCodeDisplay>{deviceFlowService.formatUserCode(state.userCode)}</UserCodeDisplay>
			</MainDisplay>

			{/* QR Code Section */}
			<QRCodeSection>
				<QRCodeLabel>QR Code Scanner</QRCodeLabel>
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

			{/* Control Buttons */}
			<ControlButtons>
				<ControlButton $variant="secondary" onClick={handleCopyUserCode}>
					<FiCopy /> Copy Code
				</ControlButton>
				<ControlButton $variant="secondary" onClick={handleCopyVerificationUri}>
					<FiCopy /> Copy URI
				</ControlButton>
				<ControlButton $variant="primary" onClick={handleOpenVerificationUri}>
					<FiExternalLink /> Open Auth
				</ControlButton>
			</ControlButtons>

			{/* System Status */}
			<SystemStatus $status={state.status}>
				<StatusIcon>{getStatusIcon()}</StatusIcon>
				<StatusText>{getStatusText()}</StatusText>
				<StatusMessage>{getStatusMessage()}</StatusMessage>
			</SystemStatus>

			{/* Success Display */}
			{state.status === 'authorized' && state.tokens && (
				<div
					style={{
						background: '#1a1a1a',
						border: '2px solid #00ff00',
						borderRadius: '0.5rem',
						padding: '1rem',
						marginTop: '1rem',
					}}
				>
					<IndustrialLabel>Authorization Successful</IndustrialLabel>
					<div
						style={{
							background: '#000000',
							padding: '1rem',
							borderRadius: '0.25rem',
							border: '1px solid #333333',
						}}
					>
						<JSONHighlighter data={state.tokens} />
					</div>
				</div>
			)}
		</IndustrialContainer>
	);
};

export default IndustrialIoTControllerDeviceFlow;
