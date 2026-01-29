// src/components/AmazonEchoShowDeviceFlow.tsx
// Amazon Echo Show Style Device Authorization Flow Interface

import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import { FiAlertTriangle, FiCheckCircle, FiCopy, FiExternalLink, FiXCircle } from 'react-icons/fi';
import styled from 'styled-components';
import {
	DeviceFlowState,
	DeviceTokenResponse,
	deviceFlowService,
} from '../services/deviceFlowService';
import { logger } from '../utils/logger';

// Amazon Echo Show Main Container - Realistic Physical Device
const EchoShowContainer = styled.div`
  background: #ffffff;
  border-radius: 0;
  padding: 0;
  margin: 1rem 0;
  position: relative;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 400px;
`;

// Physical Echo Show Frame - Black Device with Fabric Sides
const EchoShowFrame = styled.div`
  background: #000000;
  border-radius: 0.625rem;
  padding: 0.375rem;
  box-shadow: 
    0 15px 30px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  width: 100%;
  
  /* Fabric texture on sides */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      linear-gradient(90deg, 
        rgba(60, 60, 60, 0.3) 0%, 
        transparent 5%, 
        transparent 95%, 
        rgba(60, 60, 60, 0.3) 100%);
    border-radius: 0.625rem;
    pointer-events: none;
    z-index: 2;
  }
  
  /* Camera lens at top */
  &::after {
    content: '';
    position: absolute;
    top: 0.625rem;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 3;
  }
`;

// QR Code Section - Below Device
const QRCodeSection = styled.div`
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 153, 0, 0.05);
  border: 1px solid rgba(255, 153, 0, 0.2);
  border-radius: 0.5rem;
  text-align: center;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #ffffff;
  border-radius: 0.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const QRCodeLabel = styled.div`
  font-size: 0.625rem;
  font-weight: 600;
  color: rgba(255, 153, 0, 0.9);
  margin-bottom: 0.5rem;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

// Bottom Speaker Grille
const SpeakerGrille = styled.div`
  width: 100%;
  height: 12px;
  background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
  border-radius: 0 0 0.625rem 0.625rem;
  margin-top: 0.25rem;
  box-shadow: 
    0 3px 6px rgba(0, 0, 0, 0.3),
    inset 0 -2px 4px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
  
  /* Grille pattern */
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255, 255, 255, 0.05) 2px,
      rgba(255, 255, 255, 0.05) 4px
    );
`;

// Echo Show Screen - Realistic Alexa Interface with Weather
const EchoScreen = styled.div`
  background: linear-gradient(135deg, #87ceeb 0%, #4682b4 50%, #1e3a8a 100%);
  border: none;
  border-radius: 0.375rem;
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
  
  /* Weather background - sky with clouds */
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 40%),
    radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.2) 0%, transparent 35%),
    radial-gradient(circle at 50% 70%, rgba(255, 255, 255, 0.15) 0%, transparent 30%),
    linear-gradient(135deg, #87ceeb 0%, #4682b4 50%, #1e3a8a 100%);
  background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%;
  
  /* Overlay for content readability */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.2);
    z-index: 0;
  }
  
  /* Content should be above overlay */
  > * {
    position: relative;
    z-index: 1;
  }
`;

// Weather Display Section
const WeatherDisplay = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 2;
`;

const WeatherIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.25rem;
`;

const WeatherTemp = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
`;

const WeatherCondition = styled.div`
  font-size: 0.75rem;
  opacity: 0.9;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
`;

// Echo Show Status Indicator
const StatusIndicator = styled.div<{ $active: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(props) => (props.$active ? '#00ff00' : '#ff9900')};
  box-shadow: 0 0 12px ${(props) => (props.$active ? '#00ff00' : '#ff9900')};
  margin-right: 0.5rem;
  animation: ${(props) => (props.$active ? 'pulse 2s infinite' : 'pulse 2s infinite')};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`;

// Echo Show Title
const DisplayTitle = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
`;

const DisplaySubtitle = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
`;

// Echo Show User Code Display - Amazon Style
const UserCodeDisplay = styled.div`
  background: rgba(255, 153, 0, 0.1);
  color: #ff9900;
  font-family: 'Amazon Ember', 'Courier New', monospace;
  font-size: 1.5rem;
  font-weight: 600;
  padding: 1rem 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  letter-spacing: 0.2em;
  text-align: center;
  border: 1px solid rgba(255, 153, 0, 0.3);
  box-shadow: 
    0 2px 6px rgba(255, 153, 0, 0.2),
    inset 0 1px 2px rgba(255, 153, 0, 0.1);
  text-shadow: 0 0 5px rgba(255, 153, 0, 0.3);
`;

const UserCodeLabel = styled.div`
  color: rgba(255, 153, 0, 0.9);
  font-size: 0.625rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

// Status Display - Amazon Style
const StatusDisplay = styled.div<{ $status: string }>`
  background: ${(props) => {
		switch (props.$status) {
			case 'pending':
				return 'rgba(255, 153, 0, 0.15)';
			case 'authorized':
				return 'rgba(0, 255, 0, 0.15)';
			case 'denied':
				return 'rgba(255, 0, 0, 0.15)';
			case 'expired':
				return 'rgba(128, 128, 128, 0.15)';
			default:
				return 'rgba(128, 128, 128, 0.15)';
		}
	}};
  border: 1px solid ${(props) => {
		switch (props.$status) {
			case 'pending':
				return 'rgba(255, 153, 0, 0.3)';
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
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.25rem;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
`;

const StatusMessage = styled.div`
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
`;

// Control Buttons - Amazon Style
const ControlButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.75rem;
`;

const ControlButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  background: ${(props) => (props.$variant === 'primary' ? '#ff9900' : 'rgba(255, 153, 0, 0.2)')};
  color: ${(props) => (props.$variant === 'primary' ? '#ffffff' : '#ff9900')};
  border: 1px solid ${(props) => (props.$variant === 'primary' ? '#ff9900' : 'rgba(255, 153, 0, 0.4)')};
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.625rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-family: 'Amazon Ember', 'Helvetica Neue', sans-serif;
  
  &:hover {
    background: ${(props) => (props.$variant === 'primary' ? '#e68900' : 'rgba(255, 153, 0, 0.3)')};
    border-color: ${(props) => (props.$variant === 'primary' ? '#e68900' : 'rgba(255, 153, 0, 0.5)')};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

interface AmazonEchoShowDeviceFlowProps {
	state: DeviceFlowState;
	onStateUpdate: (newState: DeviceFlowState) => void;
	onComplete: (tokens: DeviceTokenResponse) => void;
	onError: (error: string) => void;
}

const AmazonEchoShowDeviceFlow: React.FC<AmazonEchoShowDeviceFlowProps> = ({
	state,
	onStateUpdate: _onStateUpdate,
	onComplete: _onComplete,
	onError: _onError,
}) => {
	const handleCopyUserCode = () => {
		navigator.clipboard.writeText(state.userCode);
		logger.info('AmazonEchoShowDeviceFlow', 'User code copied to clipboard');
	};

	const handleCopyVerificationUri = () => {
		navigator.clipboard.writeText(state.verificationUri);
		logger.info('AmazonEchoShowDeviceFlow', 'Verification URI copied to clipboard');
	};

	const handleOpenVerificationUri = () => {
		window.open(state.verificationUriComplete, '_blank');
		logger.info('AmazonEchoShowDeviceFlow', 'Verification URI opened in new tab');
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
		<EchoShowContainer>
			{/* Physical Echo Show Frame */}
			<EchoShowFrame>
				{/* Echo Show Screen */}
				<EchoScreen>
					{/* Weather Display */}
					<WeatherDisplay>
						<WeatherIcon>☀️</WeatherIcon>
						<WeatherTemp>72°</WeatherTemp>
						<WeatherCondition>Sunny</WeatherCondition>
					</WeatherDisplay>

					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							marginBottom: '1rem',
							marginTop: '2rem',
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
									fontFamily: 'Amazon Ember, Helvetica Neue, sans-serif',
								}}
							>
								<FiCheckCircle size={12} style={{ marginRight: '0.25rem' }} />
								Authorization Successful!
							</div>
						</div>
					)}
				</EchoScreen>
			</EchoShowFrame>

			{/* Bottom Speaker Grille */}
			<SpeakerGrille />

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
								color: 'rgba(255, 255, 255, 0.5)',
								marginTop: '0.5rem',
								wordBreak: 'break-all',
								fontFamily: 'Amazon Ember, Helvetica Neue, sans-serif',
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
		</EchoShowContainer>
	);
};

export default AmazonEchoShowDeviceFlow;
