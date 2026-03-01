// src/components/TeslaCarDisplayDeviceFlow.tsx
// Tesla Car Display Style Device Authorization Flow Interface

import { FiAlertTriangle, FiCheckCircle, FiCopy, FiExternalLink, FiXCircle } from '@icons';
import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import styled from 'styled-components';
import {
	DeviceFlowState,
	DeviceTokenResponse,
	deviceFlowService,
} from '../services/deviceFlowService';
import { logger } from '../utils/logger';

// Tesla Car Display Main Container - Realistic Car Dashboard
const TeslaDisplayContainer = styled.div`
  background: #ffffff;
  border-radius: 0;
  padding: 0;
  margin: 1rem 0;
  position: relative;
  max-width: 550px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 400px;
`;

// Dashboard Surface - Dark minimalist
const DashboardSurface = styled.div`
  width: 100%;
  background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
  padding: 0.75rem;
  border-radius: 0.375rem 0.375rem 0 0;
  box-shadow: 
    0 8px 16px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
`;

// Physical Car Display Frame - Realistic Dashboard Bezel with QR Code
const CarDisplayFrame = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%);
  border-radius: 0.1875rem;
  padding: 0.375rem;
  box-shadow: 
    0 15px 30px rgba(0, 0, 0, 0.6),
    inset 0 2px 4px rgba(0, 0, 0, 0.9),
    inset 0 -2px 4px rgba(255, 255, 255, 0.03);
  position: relative;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  /* Screen bezel glow */
  &::before {
    content: '';
    position: absolute;
    top: 0.375rem;
    left: 0.375rem;
    right: 0.375rem;
    bottom: 0.375rem;
    border-radius: 0.125rem;
    box-shadow: 
      inset 0 0 40px rgba(0, 0, 0, 0.95),
      0 0 15px rgba(0, 255, 0, 0.08);
    pointer-events: none;
    z-index: 1;
  }
`;

// QR Code Section - Below Device
const QRCodeSection = styled.div`
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.375rem;
  text-align: center;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #ffffff;
  border-radius: 0.125rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const QRCodeLabel = styled.div`
  font-size: 0.5rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
  font-family: 'Arial', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.2em;
`;

// Tesla Screen - Realistic Car Infotainment UI (Landscape) with Car Background
const TeslaScreen = styled.div`
  background: #ffffff;
  border: none;
  border-radius: 0.125rem;
  padding: 1rem;
  text-align: center;
  position: relative;
  min-height: 360px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  color: #000000;
  overflow: hidden;
  
  /* Tesla car background - using actual Tesla car image */
  background-image: 
    url('https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&h=800&fit=crop&q=90'),
    /* Overlay gradient for readability */
    linear-gradient(180deg, 
      rgba(255, 255, 255, 0.9) 0%,
      rgba(255, 255, 255, 0.8) 50%,
      rgba(255, 255, 255, 0.9) 100%
    );
  background-size: cover, 100% 100%;
  background-position: center center, center;
  background-repeat: no-repeat;
  
  /* Light overlay for subtle depth */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    z-index: 0;
  }
  
  /* Content should be above overlay */
  > * {
    position: relative;
    z-index: 1;
  }
`;

// Car Status Display Section (like weather on Echo Show)
const CarStatusDisplay = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 2;
`;

const CarStatusIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
`;

const CarStatusValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Arial', sans-serif;
  color: #00aa00;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.9);
`;

const CarStatusLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'Arial', sans-serif;
  color: #000000;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
`;

// Physical Controls Below Screen - Rotary Knobs
const PhysicalControls = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
  border-radius: 0 0 0.375rem 0.375rem;
  box-shadow: 
    0 3px 6px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
`;

const RotaryKnob = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.8),
    0 1px 2px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CenterButton = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.8),
    0 1px 2px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

// Tesla Status Indicator
const StatusIndicator = styled.div<{ $active: boolean }>`
  width: 8px;
  height: 8px;
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

// Tesla Title
const DisplayTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 0.5rem;
  font-family: 'Arial', sans-serif;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.8);
`;

const DisplaySubtitle = styled.div`
  font-size: 0.75rem;
  color: #000000;
  margin-bottom: 0.75rem;
  font-family: 'Arial', sans-serif;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
`;

// Tesla User Code Display - Minimalist
const UserCodeDisplay = styled.div`
  background: rgba(0, 102, 204, 0.15);
  color: #0066cc;
  font-family: 'Courier New', 'Monaco', monospace;
  font-size: 2rem;
  font-weight: 700;
  padding: 1.25rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  letter-spacing: 0.3em;
  text-align: center;
  border: 2px solid rgba(0, 102, 204, 0.5);
  box-shadow: 
    0 4px 12px rgba(0, 102, 204, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.5),
    0 0 20px rgba(0, 102, 204, 0.2);
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.9);
`;

const UserCodeLabel = styled.div`
  color: #000000;
  font-size: 0.625rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  font-family: 'Arial', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
`;

// Status Display - Tesla Style
const StatusDisplay = styled.div<{ $status: string }>`
  background: ${(props) => {
		switch (props.$status) {
			case 'pending':
				return 'rgba(255, 200, 0, 0.1)';
			case 'authorized':
				return 'rgba(0, 255, 0, 0.1)';
			case 'denied':
				return 'rgba(255, 0, 0, 0.1)';
			case 'expired':
				return 'rgba(128, 128, 128, 0.1)';
			default:
				return 'rgba(128, 128, 128, 0.1)';
		}
	}};
  border: 1px solid ${(props) => {
		switch (props.$status) {
			case 'pending':
				return 'rgba(255, 200, 0, 0.3)';
			case 'authorized':
				return 'rgba(0, 255, 0, 0.3)';
			case 'denied':
				return 'rgba(255, 0, 0, 0.3)';
			case 'expired':
				return 'rgba(128, 128, 128, 0.3)';
			default:
				return 'rgba(128, 128, 128, 0.3)';
		}
	}};
  border-radius: 0.375rem;
  padding: 0.5rem;
  text-align: center;
  margin-bottom: 0.5rem;
  font-size: 0.5rem;
`;

const StatusIcon = styled.div`
  font-size: 0.875rem;
  margin-bottom: 0.125rem;
`;

const StatusText = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 0.25rem;
  font-family: 'Arial', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
`;

const StatusMessage = styled.div`
  font-size: 0.625rem;
  color: #000000;
  font-family: 'Arial', sans-serif;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
`;

// Control Buttons - Tesla Style
const ControlButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.75rem;
`;

const ControlButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  background: ${(props) => (props.$variant === 'primary' ? 'rgba(0, 102, 204, 0.2)' : 'rgba(0, 0, 0, 0.1)')};
  color: #000000;
  border: 2px solid ${(props) => (props.$variant === 'primary' ? 'rgba(0, 102, 204, 0.5)' : 'rgba(0, 0, 0, 0.3)')};
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Arial', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  
  &:hover {
    background: ${(props) => (props.$variant === 'primary' ? 'rgba(0, 102, 204, 0.3)' : 'rgba(0, 0, 0, 0.15)')};
    border-color: ${(props) => (props.$variant === 'primary' ? 'rgba(0, 102, 204, 0.7)' : 'rgba(0, 0, 0, 0.4)')};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

interface TeslaCarDisplayDeviceFlowProps {
	state: DeviceFlowState;
	onStateUpdate: (newState: DeviceFlowState) => void;
	onComplete: (tokens: DeviceTokenResponse) => void;
	onError: (error: string) => void;
}

const TeslaCarDisplayDeviceFlow: React.FC<TeslaCarDisplayDeviceFlowProps> = ({
	state,
	onStateUpdate: _onStateUpdate,
	onComplete: _onComplete,
	onError: _onError,
}) => {
	const handleCopyUserCode = () => {
		navigator.clipboard.writeText(state.userCode);
		logger.info('TeslaCarDisplayDeviceFlow', 'User code copied to clipboard');
	};

	const handleCopyVerificationUri = () => {
		navigator.clipboard.writeText(state.verificationUri);
		logger.info('TeslaCarDisplayDeviceFlow', 'Verification URI copied to clipboard');
	};

	const handleOpenVerificationUri = () => {
		// Use verificationUriComplete if available, otherwise construct it from verificationUri + userCode
		const uriToOpen =
			state.verificationUriComplete ||
			(state.verificationUri && state.userCode
				? `${state.verificationUri}?user_code=${state.userCode}`
				: state.verificationUri);

		if (!uriToOpen) {
			logger.error('TeslaCarDisplayDeviceFlow', 'No verification URI available to open');
			return;
		}

		window.open(uriToOpen, '_blank');
		logger.info('TeslaCarDisplayDeviceFlow', 'Verification URI opened in new tab', {
			uri: uriToOpen,
		});
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
				return 'Waiting for Authorization';
			case 'authorized':
				return 'Authorization Complete';
			case 'denied':
				return 'Authorization Denied';
			case 'expired':
				return 'Authorization Expired';
			default:
				return 'Unknown Status';
		}
	};

	const getStatusMessage = () => {
		return deviceFlowService.getStatusMessage(state);
	};

	return (
		<TeslaDisplayContainer>
			{/* Dashboard Surface */}
			<DashboardSurface>
				{/* Physical Car Display Frame */}
				<CarDisplayFrame>
					{/* Tesla Screen */}
					<TeslaScreen>
						{/* Car Status Display (like weather on Echo Show) */}
						<CarStatusDisplay>
							<CarStatusIcon>🔋</CarStatusIcon>
							<CarStatusValue>78%</CarStatusValue>
							<CarStatusLabel>Battery</CarStatusLabel>
						</CarStatusDisplay>

						{/* Main Content */}
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'flex-start',
								marginTop: '2rem',
								marginBottom: '1rem',
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: '1rem',
								}}
							>
								<StatusIndicator $active={!!state.tokens} />
								<DisplayTitle>Device Authorization</DisplayTitle>
							</div>

							<DisplaySubtitle>Enter this code on your phone or computer</DisplaySubtitle>

							{/* User Code Display */}
							{state.userCode && (
								<>
									<UserCodeLabel>Authorization Code</UserCodeLabel>
									<UserCodeDisplay>{state.userCode}</UserCodeDisplay>
								</>
							)}

							{/* Status Display */}
							{state.status && (
								<StatusDisplay $status={state.status}>
									<StatusIcon>{getStatusIcon()}</StatusIcon>
									<StatusText>{getStatusText()}</StatusText>
									<StatusMessage>{getStatusMessage()}</StatusMessage>
								</StatusDisplay>
							)}

							{/* Control Buttons */}
							<ControlButtons>
								<ControlButton $variant="secondary" onClick={handleCopyUserCode}>
									<FiCopy size={12} /> Copy Code
								</ControlButton>
								<ControlButton $variant="secondary" onClick={handleCopyVerificationUri}>
									<FiCopy size={12} /> Copy URI
								</ControlButton>
							</ControlButtons>

							{/* Success Message */}
							{state.status === 'authorized' && state.tokens && (
								<div
									style={{
										background: 'rgba(0, 255, 0, 0.15)',
										border: '2px solid rgba(0, 255, 0, 0.3)',
										borderRadius: '0.75rem',
										padding: '1rem',
										marginTop: '1rem',
									}}
								>
									<div
										style={{
											fontSize: '0.625rem',
											fontWeight: '600',
											color: '#00ff00',
											textAlign: 'center',
											fontFamily: 'Arial, sans-serif',
										}}
									>
										<FiCheckCircle size={12} style={{ marginRight: '0.25rem' }} />
										Authorization Successful!
									</div>
								</div>
							)}
						</div>
					</TeslaScreen>
				</CarDisplayFrame>
			</DashboardSurface>

			{/* Physical Controls Below Screen */}
			<PhysicalControls>
				<RotaryKnob />
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					<CenterButton />
					<CenterButton />
				</div>
				<RotaryKnob />
			</PhysicalControls>

			{/* QR Code Section - Below Device */}
			{state.verificationUriComplete && (
				<QRCodeSection>
					<QRCodeLabel>Scan QR Code</QRCodeLabel>
					<QRCodeContainer>
						<QRCodeSVG
							value={state.verificationUriComplete}
							size={100}
							level="M"
							includeMargin={true}
						/>
					</QRCodeContainer>
					{state.verificationUri && (
						<div
							style={{
								fontSize: '0.5rem',
								color: 'rgba(255, 255, 255, 0.4)',
								marginTop: '0.5rem',
								wordBreak: 'break-all',
								fontFamily: 'Arial, sans-serif',
							}}
						>
							{state.verificationUri}
						</div>
					)}
					<div
						style={{
							display: 'flex',
							gap: '0.5rem',
							justifyContent: 'center',
							marginTop: '0.75rem',
						}}
					>
						<ControlButton $variant="primary" onClick={handleOpenVerificationUri}>
							<FiExternalLink size={12} /> Open in Browser
						</ControlButton>
						<ControlButton $variant="secondary" onClick={handleCopyVerificationUri}>
							<FiCopy size={12} /> Copy URI
						</ControlButton>
					</div>
				</QRCodeSection>
			)}
		</TeslaDisplayContainer>
	);
};

export default TeslaCarDisplayDeviceFlow;
