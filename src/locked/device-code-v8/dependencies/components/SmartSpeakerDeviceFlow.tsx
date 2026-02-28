// src/components/SmartSpeakerDeviceFlow.tsx
// Smart Speaker Style Device Authorization Flow Interface

import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiHome,
	FiMic,
	FiPause,
	FiSettings,
	FiVolume,
	FiVolume2,
	FiXCircle
} from 'react-icons/fi';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import StandardizedTokenDisplay from './StandardizedTokenDisplay';

// Smart Speaker Main Container - Audio/Speaker aesthetics
const SmartSpeakerContainer = styled.div`
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.4),
    0 10px 10px -5px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 2px solid #0891b2;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(8, 145, 178, 0.05) 50%, transparent 70%);
    pointer-events: none;
  }
`;

// Speaker Header
const SpeakerHeader = styled.div`
  background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%);
  border: 2px solid #22d3ee;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
`;

const SpeakerTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #22d3ee;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
`;

const SpeakerSubtitle = styled.div`
  font-size: 1rem;
  color: #67e8f9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// Audio Wave Indicators
const AudioWaveIndicators = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  align-items: end;
`;

const AudioWave = styled.div<{ $active: boolean; $color: string; $height: number }>`
  width: 4px;
  height: ${(props) => props.$height}px;
  background: ${(props) => (props.$active ? props.$color : '#374151')};
  border-radius: 2px;
  animation: ${(props) => (props.$active ? 'audioWave 1.5s infinite' : 'none')};
  animation-delay: ${(_props) => Math.random() * 0.5}s;
  
  @keyframes audioWave {
    0%, 100% { 
      opacity: 0.4; 
      transform: scaleY(0.5);
    }
    50% { 
      opacity: 1; 
      transform: scaleY(1);
    }
  }
`;

// Speaker Display Screen
const SpeakerDisplayScreen = styled.div`
  background: linear-gradient(135deg, #000000 0%, #1e293b 100%);
  border: 3px solid #22d3ee;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(34, 211, 238, 0.2);
`;

const ScreenLabel = styled.div`
  color: #22d3ee;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const UserCodeDisplay = styled.div`
  background: #000000;
  color: #f59e0b;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #f59e0b;
  border: 2px solid #f59e0b;
  box-shadow: 
    inset 0 0 20px rgba(245, 158, 11, 0.2),
    0 0 20px rgba(245, 158, 11, 0.3);
`;

// QR Code Section
const QRCodeSection = styled.div`
  background: #1e293b;
  border: 2px solid #22d3ee;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const QRCodeLabel = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #22d3ee;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

// Speaker Control Panel
const SpeakerControlPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SpeakerControlButton = styled.button<{
	$variant: 'primary' | 'secondary' | 'success' | 'danger';
}>`
  background: ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return '#22d3ee';
			case 'secondary':
				return '#374151';
			case 'success':
				return '#f59e0b';
			case 'danger':
				return '#ef4444';
			default:
				return '#374151';
		}
	}};
  color: white;
  border: 2px solid ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return '#06b6d4';
			case 'secondary':
				return '#4b5563';
			case 'success':
				return '#d97706';
			case 'danger':
				return '#dc2626';
			default:
				return '#4b5563';
		}
	}};
  border-radius: 0.5rem;
  padding: 1rem;
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
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// Status Display
const StatusDisplay = styled.div<{ $status: string }>`
  background: ${(props) => {
		switch (props.$status) {
			case 'pending':
				return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
			case 'authorized':
				return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
			case 'denied':
				return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
			case 'expired':
				return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
			default:
				return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
		}
	}};
  border: 2px solid ${(props) => {
		switch (props.$status) {
			case 'pending':
				return '#d97706';
			case 'authorized':
				return '#d97706';
			case 'denied':
				return '#dc2626';
			case 'expired':
				return '#4b5563';
			default:
				return '#4b5563';
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
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusMessage = styled.div`
  font-size: 0.875rem;
  color: #ffffff;
`;

// Speaker Base
const SpeakerBase = styled.div`
  background: linear-gradient(135deg, #0e7490 0%, #0891b2 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #22d3ee;
`;

interface SmartSpeakerDeviceFlowProps {
	state: DeviceFlowState;
	onStateUpdate: (newState: DeviceFlowState) => void;
	onComplete: (tokens: any) => void;
	onError: (error: string) => void;
}

const SmartSpeakerDeviceFlow: React.FC<SmartSpeakerDeviceFlowProps> = ({
	state,
	onStateUpdate,
	onComplete,
	onError,
}) => {
	const handleCopyUserCode = () => {
		navigator.clipboard.writeText(state.userCode);
		logger.info('SmartSpeakerDeviceFlow', 'User code copied to clipboard');
	};

	const handleCopyVerificationUri = () => {
		navigator.clipboard.writeText(state.verificationUri);
		logger.info('SmartSpeakerDeviceFlow', 'Verification URI copied to clipboard');
	};

	const handleOpenVerificationUri = () => {
		window.open(state.verificationUriComplete, '_blank');
		logger.info('SmartSpeakerDeviceFlow', 'Verification URI opened in new tab');
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
				return 'VOICE PAIRING';
			case 'authorized':
				return 'SPEAKER AUTHORIZED';
			case 'denied':
				return 'AUTHORIZATION DENIED';
			case 'expired':
				return 'SESSION EXPIRED';
			default:
				return 'UNKNOWN STATUS';
		}
	};

	const getStatusMessage = () => {
		return deviceFlowService.getStatusMessage(state);
	};

	return (
		<>
			<SmartSpeakerContainer>
				{/* Speaker Header */}
				<SpeakerHeader>
					<SpeakerTitle>
						<FiVolume2 style={{ marginRight: '0.5rem' }} />
						Smart Speaker
					</SpeakerTitle>
					<SpeakerSubtitle>Voice-Controlled Authorization System</SpeakerSubtitle>
				</SpeakerHeader>

				{/* Audio Wave Indicators */}
				<AudioWaveIndicators>
					<AudioWave $active={state.status === 'pending'} $color="#f59e0b" $height={20} />
					<AudioWave $active={state.status === 'authorized'} $color="#f59e0b" $height={30} />
					<AudioWave $active={state.status === 'denied'} $color="#ef4444" $height={15} />
					<AudioWave $active={state.status === 'expired'} $color="#6b7280" $height={10} />
					<AudioWave $active={state.status === 'pending'} $color="#f59e0b" $height={25} />
					<AudioWave $active={state.status === 'authorized'} $color="#f59e0b" $height={35} />
					<AudioWave $active={state.status === 'denied'} $color="#ef4444" $height={18} />
					<AudioWave $active={state.status === 'expired'} $color="#6b7280" $height={12} />
					<AudioWave $active={state.status === 'pending'} $color="#f59e0b" $height={22} />
					<AudioWave $active={state.status === 'authorized'} $color="#f59e0b" $height={28} />
				</AudioWaveIndicators>

				{/* Speaker Display Screen */}
				<SpeakerDisplayScreen>
					<ScreenLabel>Voice Authorization Code</ScreenLabel>
					<UserCodeDisplay>{deviceFlowService.formatUserCode(state.userCode)}</UserCodeDisplay>
				</SpeakerDisplayScreen>

				{/* QR Code Section */}
				<QRCodeSection>
					<QRCodeLabel>
						<FiMic style={{ marginRight: '0.5rem' }} />
						Voice Assistant Scanner
					</QRCodeLabel>
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

				{/* Speaker Control Panel */}
				<SpeakerControlPanel>
					<SpeakerControlButton $variant="secondary" onClick={handleCopyUserCode}>
						<FiCopy /> Copy Code
					</SpeakerControlButton>
					<SpeakerControlButton $variant="secondary" onClick={handleCopyVerificationUri}>
						<FiCopy /> Copy URI
					</SpeakerControlButton>
					<SpeakerControlButton $variant="primary" onClick={handleOpenVerificationUri}>
						<FiExternalLink /> Open in Browser
					</SpeakerControlButton>
				</SpeakerControlPanel>

				{/* Status Display */}
				<StatusDisplay $status={state.status}>
					<StatusIcon>{getStatusIcon()}</StatusIcon>
					<StatusText>{getStatusText()}</StatusText>
					<StatusMessage>{getStatusMessage()}</StatusMessage>
				</StatusDisplay>

				{/* Success Display - Realistic Smart Speaker Interface */}
				{state.status === 'authorized' && state.tokens && (
					<div
						style={{
							background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
							border: '3px solid #f97316',
							borderRadius: '1rem',
							padding: '2rem',
							marginTop: '1rem',
							boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
							color: 'white',
						}}
					>
						{/* Speaker Header */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: '1.5rem',
								paddingBottom: '1rem',
								borderBottom: '2px solid #475569',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
								<div
									style={{
										width: '40px',
										height: '40px',
										background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
										borderRadius: '50%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: 'white',
										fontSize: '1.25rem',
									}}
								>
									🔊
								</div>
								<div>
									<div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
										Amazon Echo Dot (4th Gen)
									</div>
									<div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
										Smart Speaker • Connected
									</div>
								</div>
							</div>
							<div
								style={{
									background: '#10b981',
									color: 'white',
									padding: '0.5rem 1rem',
									borderRadius: '0.5rem',
									fontSize: '0.875rem',
									fontWeight: '600',
								}}
							>
								Online
							</div>
						</div>

						{/* Now Playing Section */}
						<div
							style={{
								background: 'rgba(255, 255, 255, 0.1)',
								borderRadius: '0.75rem',
								padding: '1.5rem',
								marginBottom: '1.5rem',
								border: '1px solid #475569',
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '1rem',
									marginBottom: '1rem',
								}}
							>
								<div
									style={{
										width: '60px',
										height: '60px',
										background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
										borderRadius: '0.5rem',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: '1.5rem',
									}}
								>
									🎵
								</div>
								<div style={{ flex: 1 }}>
									<div
										style={{
											fontSize: '1.125rem',
											fontWeight: '600',
											color: 'white',
											marginBottom: '0.25rem',
										}}
									>
										Now Playing
									</div>
									<div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
										Spotify • "Lofi Hip Hop Radio"
									</div>
								</div>
								<div
									style={{
										background: '#f97316',
										color: 'white',
										padding: '0.5rem',
										borderRadius: '50%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										cursor: 'pointer',
									}}
								>
									<FiPause size={16} />
								</div>
							</div>

							{/* Audio Waveform */}
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.25rem',
									marginBottom: '0.75rem',
								}}
							>
								{[1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2, 1].map((height, index) => (
									<div
										key={index}
										style={{
											width: '3px',
											height: `${height * 4}px`,
											background: '#f97316',
											borderRadius: '1px',
											animation: 'pulse 1.5s ease-in-out infinite',
											animationDelay: `${index * 0.1}s`,
										}}
									/>
								))}
							</div>

							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									fontSize: '0.75rem',
									color: '#94a3b8',
								}}
							>
								<span>2:34</span>
								<span>4:12</span>
							</div>
						</div>

						{/* Smart Home Controls */}
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(2, 1fr)',
								gap: '1rem',
								marginBottom: '1.5rem',
							}}
						>
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.1)',
									padding: '1rem',
									borderRadius: '0.75rem',
									border: '1px solid #475569',
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.75rem',
									}}
								>
									<div style={{ fontSize: '1.25rem' }}>💡</div>
									<h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Living Room</h3>
								</div>
								<div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
									3 lights • 2 outlets
								</div>
								<div
									style={{
										background: '#10b981',
										color: 'white',
										padding: '0.25rem 0.5rem',
										borderRadius: '0.25rem',
										fontSize: '0.75rem',
										fontWeight: '600',
										display: 'inline-block',
									}}
								>
									All On
								</div>
							</div>

							<div
								style={{
									background: 'rgba(255, 255, 255, 0.1)',
									padding: '1rem',
									borderRadius: '0.75rem',
									border: '1px solid #475569',
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.75rem',
									}}
								>
									<div style={{ fontSize: '1.25rem' }}>🌡️</div>
									<h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Thermostat</h3>
								</div>
								<div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
									Nest Learning Thermostat
								</div>
								<div
									style={{
										background: '#3b82f6',
										color: 'white',
										padding: '0.25rem 0.5rem',
										borderRadius: '0.25rem',
										fontSize: '0.75rem',
										fontWeight: '600',
										display: 'inline-block',
									}}
								>
									72°F • Auto
								</div>
							</div>
						</div>

						{/* Voice Commands */}
						<div
							style={{
								background: 'rgba(255, 255, 255, 0.1)',
								borderRadius: '0.75rem',
								padding: '1.5rem',
								marginBottom: '1.5rem',
								border: '1px solid #475569',
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<div style={{ fontSize: '1.25rem' }}>🎤</div>
								<h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Recent Commands</h3>
							</div>

							<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.75rem',
										padding: '0.75rem',
										background: 'rgba(255, 255, 255, 0.05)',
										borderRadius: '0.5rem',
									}}
								>
									<div style={{ fontSize: '1rem' }}>🎵</div>
									<div style={{ flex: 1, fontSize: '0.875rem', color: '#e2e8f0' }}>
										"Play relaxing music"
									</div>
									<div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>2 min ago</div>
								</div>

								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.75rem',
										padding: '0.75rem',
										background: 'rgba(255, 255, 255, 0.05)',
										borderRadius: '0.5rem',
									}}
								>
									<div style={{ fontSize: '1rem' }}>💡</div>
									<div style={{ flex: 1, fontSize: '0.875rem', color: '#e2e8f0' }}>
										"Turn off bedroom lights"
									</div>
									<div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>5 min ago</div>
								</div>
							</div>
						</div>

						{/* Quick Actions */}
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(3, 1fr)',
								gap: '1rem',
							}}
						>
							<button
								style={{
									background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
									color: 'white',
									border: 'none',
									borderRadius: '0.5rem',
									padding: '1rem',
									fontSize: '0.875rem',
									fontWeight: '600',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '0.5rem',
								}}
							>
								<FiVolume2 /> Volume
							</button>
							<button
								style={{
									background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
									color: 'white',
									border: 'none',
									borderRadius: '0.5rem',
									padding: '1rem',
									fontSize: '0.875rem',
									fontWeight: '600',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '0.5rem',
								}}
							>
								<FiHome /> Smart Home
							</button>
							<button
								style={{
									background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
									color: 'white',
									border: 'none',
									borderRadius: '0.5rem',
									padding: '1rem',
									fontSize: '0.875rem',
									fontWeight: '600',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '0.5rem',
								}}
							>
								<FiSettings /> Settings
							</button>
						</div>
					</div>
				)}

				{/* Speaker Base */}
				<SpeakerBase />
			</SmartSpeakerContainer>

			{/* Token Display Section - RENDERED OUTSIDE container to be truly independent */}
			<StandardizedTokenDisplay
				tokens={state.tokens}
				backgroundColor="rgba(255, 255, 255, 0.1)"
				borderColor="#475569"
				headerTextColor="#e2e8f0"
			/>
		</>
	);
};

export default SmartSpeakerDeviceFlow;
