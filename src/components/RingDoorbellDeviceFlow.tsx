// src/components/RingDoorbellDeviceFlow.tsx
// Ring Video Doorbell Style Device Authorization Flow Interface
// Designed to look like actual Ring doorbell hardware

import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import {
	FiAlertTriangle,
	FiBell,
	FiCamera,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiXCircle,
} from 'react-icons/fi';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import StandardizedTokenDisplay from './StandardizedTokenDisplay';

// Ring Doorbell Physical Housing
const RingDoorbellContainer = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-radius: 1.5rem;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 8px solid #0f172a;
  position: relative;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  
  /* Ring doorbell mounting plate effect */
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
    border-radius: 1.5rem;
    background: linear-gradient(135deg, #374151 0%, #1f2937 50%, #111827 100%);
    z-index: -1;
    box-shadow: 
      0 0 30px rgba(0, 0, 0, 0.4),
      inset 0 2px 4px rgba(255, 255, 255, 0.05);
  }
`;

// Ring Camera Lens (circular)
const RingCameraLens = styled.div`
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, #000000 0%, #1f2937 60%, #374151 100%);
  border-radius: 50%;
  border: 6px solid #0f172a;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 
    0 0 20px rgba(0, 0, 0, 0.5),
    inset 0 0 20px rgba(0, 0, 0, 0.8);
  
  /* Infrared LED ring */
  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, transparent 0deg, #ef4444 45deg, transparent 90deg, transparent 270deg, #ef4444 315deg, transparent 360deg);
    opacity: 0.3;
    animation: pulse 3s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }
`;

const CameraIcon = styled.div`
  font-size: 3rem;
  color: #ffffff;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
`;

// Ring Button (the actual doorbell button)
const RingButton = styled.div<{ $status: string }>`
  width: 80px;
  height: 80px;
  background: ${(props) => {
		switch (props.$status) {
			case 'pending':
				return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
			case 'authorized':
				return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
			case 'denied':
				return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
			case 'expired':
				return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
			default:
				return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
		}
	}};
  border-radius: 50%;
  border: 4px solid #0f172a;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 
      0 6px 16px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const RingButtonIcon = styled.div`
  font-size: 2rem;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

// Ring Status Display
const RingStatusDisplay = styled.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 2px solid #374151;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #374151;
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatusLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusValue = styled.div<{ $status?: string }>`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => {
		switch (props.$status) {
			case 'online':
				return '#10b981';
			case 'offline':
				return '#ef4444';
			case 'pending':
				return '#f59e0b';
			default:
				return '#ffffff';
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
  background: ${(props) => (props.$active ? props.$color : '#6b7280')};
  box-shadow: ${(props) => (props.$active ? `0 0 8px ${props.$color}` : 'none')};
  animation: ${(props) => (props.$active ? 'pulse 2s infinite' : 'none')};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// Ring Logo and Branding
const RingBranding = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const RingLogo = styled.div`
  font-size: 2rem;
  font-weight: 900;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const RingModel = styled.div`
  font-size: 0.875rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
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
  background: ${(props) => (props.$variant === 'primary' ? '#3b82f6' : '#6b7280')};
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

interface RingDoorbellDeviceFlowProps {
	state: DeviceFlowState;
	onStateUpdate: (newState: DeviceFlowState) => void;
	onComplete: (tokens: any) => void;
	onError: (error: string) => void;
}

const RingDoorbellDeviceFlow: React.FC<RingDoorbellDeviceFlowProps> = ({
	state,
	onStateUpdate,
	onComplete,
	onError,
}) => {
	const handleCopyUserCode = () => {
		navigator.clipboard.writeText(state.userCode);
		logger.info('RingDoorbellDeviceFlow', 'User code copied to clipboard');
	};

	const handleOpenVerificationUri = () => {
		window.open(state.verificationUriComplete, '_blank');
		logger.info('RingDoorbellDeviceFlow', 'Verification URI opened in new tab');
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
				return 'Doorbell Connected';
			case 'denied':
				return 'Connection Denied';
			case 'expired':
				return 'Session Expired';
			default:
				return 'Unknown Status';
		}
	};

	return (
		<>
			<RingDoorbellContainer>
				{/* Ring Branding */}
				<RingBranding>
					<RingLogo>RING</RingLogo>
					<RingModel>Video Doorbell Pro 2</RingModel>
				</RingBranding>

				{/* Ring Camera Lens */}
				<RingCameraLens>
					<CameraIcon>
						<FiCamera />
					</CameraIcon>
				</RingCameraLens>

				{/* Ring Doorbell Button */}
				<RingButton $status={state.status}>
					<RingButtonIcon>
						<FiBell />
					</RingButtonIcon>
				</RingButton>

				{/* Status Display */}
				<RingStatusDisplay>
					<StatusRow>
						<StatusLabel>WiFi</StatusLabel>
						<StatusValue $status="online">
							<StatusDot $active={true} $color="#10b981" />
							Connected
						</StatusValue>
					</StatusRow>
					<StatusRow>
						<StatusLabel>Battery</StatusLabel>
						<StatusValue>
							<StatusDot $active={true} $color="#10b981" />
							87% - Good
						</StatusValue>
					</StatusRow>
					<StatusRow>
						<StatusLabel>Status</StatusLabel>
						<StatusValue $status={state.status}>
							{getStatusIcon()}
							{getStatusText()}
						</StatusValue>
					</StatusRow>
					<StatusRow>
						<StatusLabel>Authorization Code</StatusLabel>
						<StatusValue>
							<span style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.1em' }}>
								{deviceFlowService.formatUserCode(state.userCode)}
							</span>
						</StatusValue>
					</StatusRow>
				</RingStatusDisplay>

				{/* QR Code Section */}
				<QRCodeSection>
					<QRTitle>Connect to Ring App</QRTitle>
					<QRSubtitle>Scan this QR code with your phone to complete setup</QRSubtitle>
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
							Doorbell Connected Successfully!
						</SuccessTitle>
						<SuccessMessage>
							Your Ring Video Doorbell is now connected and ready to monitor your front door.
						</SuccessMessage>
					</SuccessDisplay>
				)}
			</RingDoorbellContainer>

			{/* Token Display Section - RENDERED OUTSIDE container to be truly independent */}
			<StandardizedTokenDisplay
				tokens={state.tokens}
				backgroundColor="rgba(0, 0, 0, 0.2)"
				borderColor="#374151"
				headerTextColor="#ffffff"
			/>
		</>
	);
};

export default RingDoorbellDeviceFlow;
