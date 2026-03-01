// src/components/AppleTVDeviceFlow.tsx
// Apple TV Style Device Authorization Flow Interface

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

// Apple TV Main Container - Realistic Physical Device
const AppleTVContainer = styled.div`
  background: #ffffff;
  border-radius: 0;
  padding: 0;
  margin: 1rem 0;
  position: relative;
  max-width: 450px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 400px;
`;

// Physical TV Screen Frame - Realistic Bezel with QR Code Area
const TVFrame = styled.div`
  background: linear-gradient(135deg, #2d2d2f 0%, #1a1a1a 50%, #2d2d2f 100%);
  border-radius: 0.375rem;
  padding: 0.375rem;
  box-shadow: 
    0 15px 30px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.5);
  position: relative;
  width: 100%;
  
  /* TV screen glow effect */
  &::before {
    content: '';
    position: absolute;
    top: 0.375rem;
    left: 0.375rem;
    right: 0.375rem;
    bottom: 0.375rem;
    border-radius: 0.1875rem;
    box-shadow: 
      inset 0 0 20px rgba(0, 0, 0, 0.8),
      0 0 30px rgba(0, 0, 0, 0.2);
    pointer-events: none;
    z-index: 1;
  }
`;

// Apple TV Screen - Realistic tvOS Interface with Movie Background
const TVScreen = styled.div`
  background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%);
  border: none;
  border-radius: 0.1875rem;
  padding: 1rem;
  text-align: center;
  position: relative;
  min-height: 360px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  color: #ffffff;
  overflow: hidden;
  
  /* Forest Gump movie poster background - iconic poster with Tom Hanks on park bench */
  background-image: 
    url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=800&fit=crop&q=90');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  
  /* Content should be above overlay */
  > * {
    position: relative;
    z-index: 1;
  }
`;

// Movie Playback Controls (like when watching on Apple TV)
const MovieControls = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  z-index: 2;
  background: rgba(0, 0, 0, 0.6);
  padding: 0.75rem;
  border-radius: 0.5rem;
`;

const PlaybackProgress = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  width: 35%;
  background: #ffffff;
  border-radius: 2px;
`;

const PlaybackTime = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.8);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  margin-top: 0.25rem;
`;

const PlaybackButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.25rem;
`;

const PlayButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.75rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

// Physical Apple TV Box
const AppleTVBox = styled.div`
  width: 120px;
  height: 40px;
  background: linear-gradient(135deg, #1d1d1f 0%, #000000 100%);
  border-radius: 0.25rem;
  margin: 0.5rem 0;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  
  /* Apple logo on box */
  &::before {
    content: '⌽';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.6);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
`;

// Siri Remote - Grey with Apple TV Control Buttons
const SiriRemote = styled.div`
  width: 70px;
  height: 200px;
  background: linear-gradient(135deg, #8e8e93 0%, #636366 100%);
  border-radius: 0.75rem;
  margin: 0.5rem 0;
  box-shadow: 
    0 6px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  position: relative;
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

// Touch Surface (Top)
const TouchSurface = styled.div`
  width: 100%;
  height: 90px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 0.5rem;
  margin-bottom: 0.25rem;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
  
  /* Center indicator */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
  }
`;

// Control Buttons Container
const RemoteButtons = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  width: 100%;
  flex: 1;
`;

// Menu Button
const MenuButton = styled.div`
  width: 35px;
  height: 6px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 3px;
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.8),
    0 1px 1px rgba(255, 255, 255, 0.1);
`;

// Play/Pause Button
const PlayPauseButton = styled.div`
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.8),
    0 1px 2px rgba(255, 255, 255, 0.1);
  position: relative;
  
  /* Play icon */
  &::before {
    content: '▶';
    position: absolute;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.7);
    left: 52%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
`;

// Volume Buttons
const VolumeButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
`;

const VolumeButton = styled.div`
  width: 20px;
  height: 3px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 2px;
  box-shadow: 
    inset 0 1px 1px rgba(0, 0, 0, 0.8),
    0 1px 1px rgba(255, 255, 255, 0.1);
`;

// Apple TV Status Indicator
const StatusIndicator = styled.div<{ $active: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(props) => (props.$active ? '#34c759' : '#ff3b30')};
  box-shadow: 0 0 12px ${(props) => (props.$active ? '#34c759' : '#ff3b30')};
  margin-right: 0.5rem;
  animation: ${(props) => (props.$active ? 'pulse 2s infinite' : 'none')};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`;

// Apple TV Title - SF Pro Display style
const TVTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  letter-spacing: -0.02em;
  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5);
`;

const TVSubtitle = styled.div`
  font-size: 0.875rem;
  color: #ffffff;
  margin-bottom: 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.5);
`;

// Apple TV User Code Display - Clean, Modern
const UserCodeDisplay = styled.div`
  background: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  font-size: 2rem;
  font-weight: 700;
  padding: 1.5rem 2rem;
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  text-align: center;
  border: 3px solid rgba(255, 255, 255, 0.5);
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.6),
    inset 0 2px 4px rgba(255, 255, 255, 0.2),
    0 0 30px rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
`;

const UserCodeLabel = styled.div`
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.5);
`;

// Status Display - Apple Style
const StatusDisplay = styled.div<{ $status: string }>`
  background: ${(props) => {
		switch (props.$status) {
			case 'pending':
				return 'rgba(255, 149, 0, 0.15)';
			case 'authorized':
				return 'rgba(52, 199, 89, 0.15)';
			case 'denied':
				return 'rgba(255, 59, 48, 0.15)';
			case 'expired':
				return 'rgba(142, 142, 147, 0.15)';
			default:
				return 'rgba(142, 142, 147, 0.15)';
		}
	}};
  border: 1px solid ${(props) => {
		switch (props.$status) {
			case 'pending':
				return 'rgba(255, 149, 0, 0.3)';
			case 'authorized':
				return 'rgba(52, 199, 89, 0.3)';
			case 'denied':
				return 'rgba(255, 59, 48, 0.3)';
			case 'expired':
				return 'rgba(142, 142, 147, 0.3)';
			default:
				return 'rgba(142, 142, 147, 0.3)';
		}
	}};
  border-radius: 0.5rem;
  padding: 0.75rem;
  text-align: center;
  margin-bottom: 0.5rem;
`;

const StatusIcon = styled.div`
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
`;

const StatusText = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.5);
`;

const StatusMessage = styled.div`
  font-size: 0.875rem;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 0, 0, 0.5);
`;

// Control Buttons - Apple Style
const ControlButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.75rem;
`;

const ControlButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  background: ${(props) => (props.$variant === 'primary' ? '#007aff' : 'rgba(255, 255, 255, 0.1)')};
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.625rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  
  &:hover {
    background: ${(props) => (props.$variant === 'primary' ? '#0051d5' : 'rgba(255, 255, 255, 0.15)')};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// TV Stand Base
const TVStand = styled.div`
  width: 200px;
  height: 8px;
  background: linear-gradient(135deg, #2d2d2f 0%, #1a1a1a 100%);
  border-radius: 0 0 0.5rem 0.5rem;
  margin-top: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

interface AppleTVDeviceFlowProps {
	state: DeviceFlowState;
	onStateUpdate: (newState: DeviceFlowState) => void;
	onComplete: (tokens: DeviceTokenResponse) => void;
	onError: (error: string) => void;
}

const AppleTVDeviceFlow: React.FC<AppleTVDeviceFlowProps> = ({
	state,
	onStateUpdate: _onStateUpdate,
	onComplete: _onComplete,
	onError: _onError,
}) => {
	const handleCopyUserCode = () => {
		navigator.clipboard.writeText(state.userCode);
		logger.info('AppleTVDeviceFlow', 'User code copied to clipboard');
	};

	const handleCopyVerificationUri = () => {
		navigator.clipboard.writeText(state.verificationUri);
		logger.info('AppleTVDeviceFlow', 'Verification URI copied to clipboard');
	};

	const handleOpenVerificationUri = () => {
		window.open(state.verificationUriComplete, '_blank');
		logger.info('AppleTVDeviceFlow', 'Verification URI opened in new tab');
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
		<AppleTVContainer>
			{/* Physical TV Frame */}
			<TVFrame>
				{/* TV Screen */}
				<TVScreen>
					{/* Movie Playback Controls (bottom of screen) */}
					<MovieControls>
						<PlaybackProgress>
							<ProgressBar />
						</PlaybackProgress>
						<PlaybackTime>
							<span>12:34</span>
							<span>35:42</span>
						</PlaybackTime>
						<PlaybackButtons>
							<PlayButton>⏮</PlayButton>
							<PlayButton>⏸</PlayButton>
							<PlayButton>⏭</PlayButton>
						</PlaybackButtons>
					</MovieControls>

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
							<TVTitle>Device Authorization</TVTitle>
						</div>

						<TVSubtitle>Scan QR code or enter this code on your phone or computer</TVSubtitle>

						{/* QR Code Display */}
						{(state.verificationUriComplete || (state.verificationUri && state.userCode)) && (
							<div
								style={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									marginBottom: '1rem',
									padding: '0.75rem',
									backgroundColor: 'rgba(255, 255, 255, 0.95)',
									borderRadius: '0.5rem',
									border: '2px solid rgba(255, 255, 255, 0.3)',
									boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
								}}
							>
								<QRCodeSVG
									value={
										state.verificationUriComplete ||
										`${state.verificationUri}?user_code=${state.userCode}`
									}
									size={180}
									level="M"
									includeMargin={true}
								/>
							</div>
						)}

						{/* User Code Display */}
						{state.userCode && (
							<>
								<UserCodeLabel>Enter Code</UserCodeLabel>
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
							<ControlButton $variant="primary" onClick={handleOpenVerificationUri}>
								<FiExternalLink size={12} /> Open in Browser
							</ControlButton>
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
									background: 'rgba(52, 199, 89, 0.15)',
									border: '2px solid rgba(52, 199, 89, 0.3)',
									borderRadius: '0.75rem',
									padding: '1rem',
									marginTop: '1rem',
								}}
							>
								<div
									style={{
										fontSize: '0.625rem',
										fontWeight: '600',
										color: '#34c759',
										textAlign: 'center',
										fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
									}}
								>
									<FiCheckCircle size={12} style={{ marginRight: '0.25rem' }} />
									Authorization Successful!
								</div>
							</div>
						)}
					</div>
				</TVScreen>
			</TVFrame>

			{/* Physical Apple TV Box */}
			<AppleTVBox />

			{/* Siri Remote - Grey with Control Buttons */}
			<SiriRemote>
				<TouchSurface />
				<RemoteButtons>
					<MenuButton />
					<PlayPauseButton />
					<VolumeButtons>
						<VolumeButton />
						<VolumeButton />
					</VolumeButtons>
				</RemoteButtons>
			</SiriRemote>

			{/* TV Stand */}
			<TVStand />
		</AppleTVContainer>
	);
};

export default AppleTVDeviceFlow;
