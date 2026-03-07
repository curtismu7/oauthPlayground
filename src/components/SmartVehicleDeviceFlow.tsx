// src/components/SmartVehicleDeviceFlow.tsx
// Smart Vehicle Style Device Authorization Flow Interface

import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiMusic,
	FiNavigation,
	FiSettings,
	FiTruck,
	FiXCircle,
} from '@icons';
import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import StandardizedTokenDisplay from './StandardizedTokenDisplay';

// Tesla Screen Main Container - Automotive Display
const SmartVehicleContainer = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 2rem 0;
  box-shadow: 
    0 30px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 2px solid #3a3a3c;
  position: relative;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  color: V9_COLORS.TEXT.WHITE;
  
  /* Tesla screen bezel */
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
  
  /* Tesla logo area */
  &::after {
    content: 'TESLA';
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: V9_COLORS.TEXT.WHITE;
    letter-spacing: 1px;
    z-index: 2;
  }
`;

// Tesla Dashboard Header
const VehicleHeader = styled.div`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid #3a3a3c;
  border-radius: 0.25rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  color: V9_COLORS.TEXT.WHITE;
  font-weight: 600;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  font-size: 0.875rem;
  letter-spacing: 0.5px;
`;

const VehicleTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.WHITE;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  letter-spacing: 0.1em;
  text-shadow: 0 0 10px rgba(252, 165, 165, 0.5);
`;

const VehicleSubtitle = styled.div`
  font-size: 1rem;
  color: V9_COLORS.BG.ERROR_BORDER;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// Dashboard Indicators
const DashboardIndicators = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const DashboardIndicator = styled.div<{ $active: boolean; $color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${(props) => (props.$active ? props.$color : 'V9_COLORS.TEXT.GRAY_DARK')};
  box-shadow: ${(props) => (props.$active ? `0 0 20px ${props.$color}` : 'none')};
  animation: ${(props) => (props.$active ? 'dashboardPulse 2s infinite' : 'none')};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${(props) => (props.$active ? 'V9_COLORS.TEXT.WHITE' : 'transparent')};
    animation: ${(props) => (props.$active ? 'innerPulse 1.5s infinite' : 'none')};
  }
  
  @keyframes dashboardPulse {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.7; 
      transform: scale(1.1);
    }
  }
  
  @keyframes innerPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

// Vehicle Display Screen
const VehicleDisplayScreen = styled.div`
  background: linear-gradient(135deg, V9_COLORS.TEXT.BLACK 0%, #1e293b 100%);
  border: 3px solid V9_COLORS.PRIMARY.RED_LIGHT;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
  position: relative;
  box-shadow: 
    inset 0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(248, 113, 113, 0.2);
`;

const ScreenLabel = styled.div`
  color: V9_COLORS.PRIMARY.RED_LIGHT;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const UserCodeDisplay = styled.div`
  background: V9_COLORS.TEXT.BLACK;
  color: V9_COLORS.PRIMARY.GREEN;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px V9_COLORS.PRIMARY.GREEN;
  border: 2px solid V9_COLORS.PRIMARY.GREEN;
  box-shadow: 
    inset 0 0 20px rgba(34, 197, 94, 0.2),
    0 0 20px rgba(34, 197, 94, 0.3);
`;

// QR Code Section
const QRCodeSection = styled.div`
  background: #1e293b;
  border: 2px solid V9_COLORS.PRIMARY.RED_LIGHT;
  border-radius: 0.75rem;
  padding: 0.75rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const QRCodeLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: V9_COLORS.PRIMARY.RED_LIGHT;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 0;
`;

// Vehicle Control Panel
const VehicleControlPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const VehicleControlButton = styled.button<{
	$variant: 'primary' | 'secondary' | 'success' | 'danger';
}>`
  background: ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return 'V9_COLORS.PRIMARY.RED_LIGHT';
			case 'secondary':
				return 'V9_COLORS.TEXT.GRAY_DARK';
			case 'success':
				return 'V9_COLORS.PRIMARY.GREEN';
			case 'danger':
				return 'V9_COLORS.PRIMARY.RED';
			default:
				return 'V9_COLORS.TEXT.GRAY_DARK';
		}
	}};
  color: white;
  border: 2px solid ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return 'V9_COLORS.PRIMARY.RED';
			case 'secondary':
				return '#4b5563';
			case 'success':
				return 'V9_COLORS.PRIMARY.GREEN_DARK';
			case 'danger':
				return 'V9_COLORS.PRIMARY.RED_DARK';
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
				return 'linear-gradient(135deg, V9_COLORS.PRIMARY.YELLOW 0%, V9_COLORS.PRIMARY.YELLOW_DARK 100%)';
			case 'authorized':
				return 'linear-gradient(135deg, V9_COLORS.PRIMARY.GREEN 0%, V9_COLORS.PRIMARY.GREEN_DARK 100%)';
			case 'denied':
				return 'linear-gradient(135deg, V9_COLORS.PRIMARY.RED 0%, V9_COLORS.PRIMARY.RED_DARK 100%)';
			case 'expired':
				return 'linear-gradient(135deg, V9_COLORS.TEXT.GRAY_MEDIUM 0%, #4b5563 100%)';
			default:
				return 'linear-gradient(135deg, V9_COLORS.TEXT.GRAY_MEDIUM 0%, #4b5563 100%)';
		}
	}};
  border: 2px solid ${(props) => {
		switch (props.$status) {
			case 'pending':
				return 'V9_COLORS.PRIMARY.YELLOW_DARK';
			case 'authorized':
				return 'V9_COLORS.PRIMARY.GREEN_DARK';
			case 'denied':
				return 'V9_COLORS.PRIMARY.RED_DARK';
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
  color: V9_COLORS.TEXT.WHITE;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusMessage = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.WHITE;
`;

// Vehicle Base
const VehicleBase = styled.div`
  background: linear-gradient(135deg, V9_COLORS.PRIMARY.RED_DARK 0%, V9_COLORS.PRIMARY.RED 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid V9_COLORS.PRIMARY.RED_LIGHT;
`;

interface SmartVehicleDeviceFlowProps {
	state: DeviceFlowState;
	onStateUpdate: (newState: DeviceFlowState) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onComplete: (tokens: any) => void;
	onError: (error: string) => void;
}

const SmartVehicleDeviceFlow: React.FC<SmartVehicleDeviceFlowProps> = ({
	state,
	onStateUpdate,
	onComplete,
	onError,
}) => {
	const handleCopyUserCode = () => {
		navigator.clipboard.writeText(state.userCode);
		logger.info('SmartVehicleDeviceFlow', 'User code copied to clipboard');
	};

	const handleCopyVerificationUri = () => {
		navigator.clipboard.writeText(state.verificationUri);
		logger.info('SmartVehicleDeviceFlow', 'Verification URI copied to clipboard');
	};

	const handleOpenVerificationUri = () => {
		window.open(state.verificationUriComplete, '_blank');
		logger.info('SmartVehicleDeviceFlow', 'Verification URI opened in new tab');
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
				return 'VEHICLE SYNC';
			case 'authorized':
				return 'VEHICLE AUTHORIZED';
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
			<SmartVehicleContainer>
				{/* Vehicle Header */}
				<VehicleHeader>
					<VehicleTitle>
						<FiTruck style={{ marginRight: '0.5rem' }} />
						Tesla Model Y
					</VehicleTitle>
					<VehicleSubtitle>Autopilot Authorization System</VehicleSubtitle>
				</VehicleHeader>

				{/* Dashboard Indicators */}
				<DashboardIndicators>
					<DashboardIndicator
						$active={state.status === 'pending'}
						$color="V9_COLORS.PRIMARY.YELLOW"
					/>
					<DashboardIndicator
						$active={state.status === 'authorized'}
						$color="V9_COLORS.PRIMARY.GREEN"
					/>
					<DashboardIndicator $active={state.status === 'denied'} $color="V9_COLORS.PRIMARY.RED" />
					<DashboardIndicator
						$active={state.status === 'expired'}
						$color="V9_COLORS.TEXT.GRAY_MEDIUM"
					/>
				</DashboardIndicators>

				{/* Vehicle Display Screen */}
				<VehicleDisplayScreen>
					<ScreenLabel>Infotainment Authorization Code</ScreenLabel>
					<UserCodeDisplay>{deviceFlowService.formatUserCode(state.userCode)}</UserCodeDisplay>
				</VehicleDisplayScreen>

				{/* QR Code Section */}
				{state.verificationUriComplete && (
					<QRCodeSection>
						<QRCodeLabel>
							<FiNavigation style={{ marginRight: '0.5rem' }} />
							Telematics Scanner
						</QRCodeLabel>
						<QRCodeContainer>
							<QRCodeSVG
								value={state.verificationUriComplete}
								size={120}
								bgColor="V9_COLORS.TEXT.WHITE"
								fgColor="V9_COLORS.TEXT.BLACK"
								level="M"
								includeMargin={true}
							/>
						</QRCodeContainer>
					</QRCodeSection>
				)}

				{/* Vehicle Control Panel */}
				<VehicleControlPanel>
					<VehicleControlButton $variant="secondary" onClick={handleCopyUserCode}>
						<FiCopy /> Copy Code
					</VehicleControlButton>
					<VehicleControlButton $variant="secondary" onClick={handleCopyVerificationUri}>
						<FiCopy /> Copy URI
					</VehicleControlButton>
					<VehicleControlButton $variant="primary" onClick={handleOpenVerificationUri}>
						<FiExternalLink /> Open in Browser
					</VehicleControlButton>
				</VehicleControlPanel>

				{/* Status Display */}
				<StatusDisplay $status={state.status}>
					<StatusIcon>{getStatusIcon()}</StatusIcon>
					<StatusText>{getStatusText()}</StatusText>
					<StatusMessage>{getStatusMessage()}</StatusMessage>
				</StatusDisplay>

				{/* Success Display - Realistic Car Dashboard */}
				{state.status === 'authorized' && state.tokens && (
					<div
						style={{
							background: 'linear-gradient(135deg, V9_COLORS.TEXT.GRAY_DARK 0%, #1e293b 100%)',
							border: '3px solid #f97316',
							borderRadius: '1rem',
							padding: '1.5rem',
							marginTop: '1rem',
							boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
							color: 'white',
						}}
					>
						{/* Dashboard Header */}
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: '1.5rem',
								paddingBottom: '1rem',
								borderBottom: '2px solid V9_COLORS.TEXT.GRAY_DARK',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
								<div
									style={{
										width: '40px',
										height: '40px',
										background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
										borderRadius: '0.5rem',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										color: 'white',
										fontSize: '1.25rem',
									}}
								>
									🚗
								</div>
								<div>
									<div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
										Tesla Model 3
									</div>
									<div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
										Connected • Ready to Drive
									</div>
								</div>
							</div>
							<div
								style={{
									background: 'V9_COLORS.PRIMARY.GREEN',
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

						{/* Speedometer and Key Metrics */}
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 2fr 1fr',
								gap: '1.5rem',
								marginBottom: '1.5rem',
							}}
						>
							{/* Battery Level */}
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.1)',
									padding: '1.5rem',
									borderRadius: '0.75rem',
									textAlign: 'center',
									border: '1px solid V9_COLORS.TEXT.GRAY_DARK',
								}}
							>
								<div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔋</div>
								<div
									style={{
										fontSize: '1.5rem',
										fontWeight: '700',
										color: 'V9_COLORS.PRIMARY.GREEN',
									}}
								>
									85%
								</div>
								<div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Battery</div>
								<div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
									280 mi range
								</div>
							</div>

							{/* Speedometer */}
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.1)',
									padding: '1.5rem',
									borderRadius: '0.75rem',
									textAlign: 'center',
									border: '1px solid V9_COLORS.TEXT.GRAY_DARK',
									position: 'relative',
								}}
							>
								<div
									style={{
										width: '120px',
										height: '120px',
										border: '8px solid V9_COLORS.TEXT.GRAY_DARK',
										borderRadius: '50%',
										margin: '0 auto 1rem',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										background:
											'conic-gradient(from 0deg, #f97316 0deg, #f97316 72deg, V9_COLORS.TEXT.GRAY_DARK 72deg)',
									}}
								>
									<div
										style={{
											width: '80px',
											height: '80px',
											background: 'V9_COLORS.TEXT.GRAY_DARK',
											borderRadius: '50%',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontSize: '1.5rem',
											fontWeight: '700',
											color: 'white',
										}}
									>
										35
									</div>
								</div>
								<div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>mph</div>
							</div>

							{/* Temperature */}
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.1)',
									padding: '1.5rem',
									borderRadius: '0.75rem',
									textAlign: 'center',
									border: '1px solid V9_COLORS.TEXT.GRAY_DARK',
								}}
							>
								<div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌡️</div>
								<div
									style={{ fontSize: '1.5rem', fontWeight: '700', color: 'V9_COLORS.PRIMARY.BLUE' }}
								>
									72°F
								</div>
								<div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Outside</div>
								<div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
									AC: Auto
								</div>
							</div>
						</div>

						{/* Navigation and Media */}
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: '1rem',
								marginBottom: '1.5rem',
							}}
						>
							<div
								style={{
									background: 'rgba(255, 255, 255, 0.1)',
									padding: '1rem',
									borderRadius: '0.75rem',
									border: '1px solid V9_COLORS.TEXT.GRAY_DARK',
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
									<div style={{ fontSize: '1.25rem' }}>🧭</div>
									<h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Navigation</h3>
								</div>
								<div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
									Destination: Downtown Office
								</div>
								<div style={{ fontSize: '0.75rem', color: 'V9_COLORS.PRIMARY.GREEN' }}>
									ETA: 12 minutes • 3.2 miles
								</div>
							</div>

							<div
								style={{
									background: 'rgba(255, 255, 255, 0.1)',
									padding: '1rem',
									borderRadius: '0.75rem',
									border: '1px solid V9_COLORS.TEXT.GRAY_DARK',
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
									<div style={{ fontSize: '1.25rem' }}>🎵</div>
									<h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Media</h3>
								</div>
								<div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
									Now Playing: Spotify
								</div>
								<div style={{ fontSize: '0.75rem', color: 'V9_COLORS.PRIMARY.GREEN' }}>
									"Electric Dreams" - Synthwave Mix
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
								<FiNavigation /> Navigate
							</button>
							<button
								style={{
									background:
										'linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%)',
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
								<FiMusic /> Media
							</button>
							<button
								style={{
									background:
										'linear-gradient(135deg, V9_COLORS.PRIMARY.GREEN 0%, V9_COLORS.PRIMARY.GREEN_DARK 100%)',
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
								<FiSettings /> Climate
							</button>
						</div>
					</div>
				)}

				{/* Vehicle Base */}
				<VehicleBase />
			</SmartVehicleContainer>

			{/* Token Display Section - RENDERED OUTSIDE container to be truly independent */}
			<StandardizedTokenDisplay
				tokens={state.tokens}
				backgroundColor="rgba(0, 0, 0, 0.4)"
				borderColor="V9_COLORS.TEXT.GRAY_DARK"
				headerTextColor="V9_COLORS.TEXT.WHITE"
			/>
		</>
	);
};

export default SmartVehicleDeviceFlow;
