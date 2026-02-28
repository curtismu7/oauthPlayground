// src/components/SmartTVDeviceFlow.tsx
// Smart TV Style Device Authorization Flow Interface

import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import { FiAlertTriangle, FiCheckCircle, FiCopy, FiExternalLink, FiXCircle } from '@icons';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import StandardizedTokenDisplay from './StandardizedTokenDisplay';

// Vizio TV Main Container - Authentic Vizio Design
const SmartTVContainer = styled.div`
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 2rem 0;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 2px solid #333333;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  
  /* Vizio TV bezel */
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
    border-radius: 0.5rem;
    z-index: -1;
  }
  
  /* Vizio logo area */
  &::after {
    content: 'VIZIO';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 1px;
    z-index: 2;
  }
`;

// Vizio SmartCast Screen - Authentic Interface
const TVScreen = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid #3a3a3c;
  border-radius: 0.25rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  color: #ffffff;
  
  /* Vizio SmartCast interface styling */
  &::before {
    content: 'SmartCast';
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: 0.5px;
    z-index: 2;
  }
`;

const TVBrand = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: #666666;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const TVStatusIndicator = styled.div<{ $active: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(props) => (props.$active ? '#00ff00' : '#ff0000')};
  box-shadow: 0 0 10px ${(props) => (props.$active ? '#00ff00' : '#ff0000')};
  margin-right: 0.5rem;
  animation: ${(props) => (props.$active ? 'pulse 2s infinite' : 'none')};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const TVTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TVSubtitle = styled.div`
  font-size: 1rem;
  color: #cccccc;
  margin-bottom: 2rem;
`;

// Vizio SmartCast User Code Display - Modern Streaming Interface
const UserCodeDisplay = styled.div`
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: 3rem;
  font-weight: 700;
  padding: 2rem 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.3em;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
`;

const UserCodeLabel = styled.div`
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// QR Code Section
const QRCodeSection = styled.div`
  background: #1a1a1a;
  border: 2px solid #333333;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const QRCodeLabel = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 1rem;
  text-transform: uppercase;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

// Status Display
const StatusDisplay = styled.div<{ $status: string }>`
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
`;

const StatusMessage = styled.div`
  font-size: 0.875rem;
  color: #ffffff;
`;

// Control Buttons
const ControlButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const ControlButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  background: ${(props) => (props.$variant === 'primary' ? '#0066cc' : '#404040')};
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${(props) => (props.$variant === 'primary' ? '#0052a3' : '#555555')};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
`;

// TV Stand
const TVStand = styled.div`
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  height: 1rem;
  border-radius: 0 0 0.5rem 0.5rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #404040;
`;

interface SmartTVDeviceFlowProps {
	state: DeviceFlowState;
	onStateUpdate: (newState: DeviceFlowState) => void;
	onComplete: (tokens: any) => void;
	onError: (error: string) => void;
}

const SmartTVDeviceFlow: React.FC<SmartTVDeviceFlowProps> = ({
	state,
	onStateUpdate,
	onComplete,
	onError,
}) => {
	const handleCopyUserCode = () => {
		navigator.clipboard.writeText(state.userCode);
		logger.info('SmartTVDeviceFlow', 'User code copied to clipboard');
	};

	const handleCopyVerificationUri = () => {
		navigator.clipboard.writeText(state.verificationUri);
		logger.info('SmartTVDeviceFlow', 'Verification URI copied to clipboard');
	};

	const handleOpenVerificationUri = () => {
		window.open(state.verificationUriComplete, '_blank');
		logger.info('SmartTVDeviceFlow', 'Verification URI opened in new tab');
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
		<>
			<SmartTVContainer>
				{/* TV Screen */}
				<TVScreen>
					<TVBrand>Smart TV</TVBrand>

					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							marginBottom: '1rem',
						}}
					>
						<TVStatusIndicator $active={!!state.tokens} />
						<TVTitle>Device Authorization</TVTitle>
					</div>

					<TVSubtitle>Enter the code below on your device to authorize</TVSubtitle>

					<UserCodeLabel>Enter this code on your device</UserCodeLabel>
					<UserCodeDisplay>{deviceFlowService.formatUserCode(state.userCode)}</UserCodeDisplay>

					{/* QR Code Section */}
					{state.verificationUriComplete && (
						<QRCodeSection>
							<QRCodeLabel>QR Code (for mobile apps)</QRCodeLabel>
							<QRCodeContainer>
								<QRCodeSVG
									value={state.verificationUriComplete}
									size={180}
									bgColor="#ffffff"
									fgColor="#000000"
									level="M"
									includeMargin={true}
								/>
							</QRCodeContainer>
						</QRCodeSection>
					)}

					{/* Status Display */}
					<StatusDisplay $status={state.status}>
						<StatusIcon>{getStatusIcon()}</StatusIcon>
						<StatusText>{getStatusText()}</StatusText>
						<StatusMessage>{getStatusMessage()}</StatusMessage>
					</StatusDisplay>

					{/* Authorization Action - Prominent */}
					{state.verificationUri && (
						<div
							style={{
								background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
								borderRadius: '0.75rem',
								padding: '0.75rem 1rem',
								marginBottom: '1rem',
								textAlign: 'center',
								boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)',
								border: '2px solid #1e40af',
							}}
						>
							<ControlButton
								$variant="primary"
								onClick={handleOpenVerificationUri}
								style={{
									fontSize: '1rem',
									padding: '0.75rem 1.5rem',
									minWidth: '200px',
									background: 'white',
									color: '#2563eb',
									border: '2px solid white',
									fontWeight: '700',
									boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
								}}
							>
								<FiExternalLink size={18} /> Open in Browser
							</ControlButton>
						</div>
					)}

					{/* Control Buttons */}
					<ControlButtons>
						<ControlButton $variant="secondary" onClick={handleCopyUserCode}>
							<FiCopy /> Copy Code
						</ControlButton>
						<ControlButton $variant="secondary" onClick={handleCopyVerificationUri}>
							<FiCopy /> Copy URI
						</ControlButton>
					</ControlButtons>

					{/* Success Message in TV Screen */}
					{state.status === 'authorized' && state.tokens && (
						<div
							style={{
								background: 'rgba(0, 255, 0, 0.1)',
								border: '2px solid #00ff00',
								borderRadius: '0.5rem',
								padding: '1rem',
								marginTop: '1rem',
							}}
						>
							<div
								style={{
									fontSize: '1rem',
									fontWeight: '600',
									color: '#00ff00',
									textAlign: 'center',
								}}
							>
								<FiCheckCircle style={{ marginRight: '0.5rem' }} />
								Authorization Successful!
							</div>
						</div>
					)}
				</TVScreen>

				{/* TV Stand */}
				<TVStand />
			</SmartTVContainer>

			{/* Token Display Section - RENDERED OUTSIDE container to be truly independent */}
			<StandardizedTokenDisplay
				tokens={state.tokens}
				backgroundColor="rgba(0, 0, 0, 0.4)"
				borderColor="#3a3a3c"
				headerTextColor="#ffffff"
			/>
		</>
	);
};

export default SmartTVDeviceFlow;
