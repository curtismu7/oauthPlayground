// src/components/VizioTVDeviceFlow.tsx
// VIZIO Smart TV Style Device Authorization Flow Interface
// Designed to look like actual VIZIO V-Series 4K TV

import { FiAlertTriangle, FiCheckCircle, FiCopy, FiExternalLink, FiPlay, FiXCircle } from '@icons';
import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import StandardizedTokenDisplay from './StandardizedTokenDisplay';

// VIZIO TV Physical Housing
const VizioTVContainer = styled.div`
  background: linear-gradient(135deg, V9_COLORS.TEXT.GRAY_DARK 0%, V9_COLORS.TEXT.GRAY_DARK 100%);
  border-radius: 1.5rem;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 12px solid V9_COLORS.TEXT.GRAY_DARK;
  position: relative;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  
  /* TV stand/base */
  &::after {
    content: '';
    position: absolute;
    bottom: -40px;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 40px;
    background: linear-gradient(180deg, V9_COLORS.TEXT.GRAY_DARK 0%, V9_COLORS.TEXT.GRAY_DARK 100%);
    border-radius: 0 0 20px 20px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }
`;

// VIZIO TV Screen
const TVScreen = styled.div<{ $showContent?: boolean }>`
  background: ${({ $showContent }) =>
		$showContent ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)' : 'V9_COLORS.TEXT.BLACK'};
  border: 3px solid V9_COLORS.TEXT.GRAY_DARK;
  border-radius: 0.75rem;
  padding: ${({ $showContent }) => ($showContent ? '2rem' : '3rem')};
  margin-bottom: 1rem;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.6);
  position: relative;
  overflow: hidden;
`;

// VIZIO Logo and Branding
const VizioBranding = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const VizioLogo = styled.div`
  font-size: 1.5rem;
  font-weight: 900;
  color: V9_COLORS.TEXT.WHITE;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const VizioModel = styled.div`
  font-size: 0.75rem;
  color: V9_COLORS.TEXT.GRAY_LIGHT;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

// TV Status Indicators
const StatusIndicators = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
`;

const StatusIndicator = styled.div<{ $active: boolean; $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(props) => (props.$active ? props.$color : 'V9_COLORS.TEXT.GRAY_MEDIUM')};
  box-shadow: ${(props) => (props.$active ? `0 0 12px ${props.$color}` : 'none')};
  animation: ${(props) => (props.$active ? 'pulse 2s infinite' : 'none')};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// VIZIO SmartCast Interface
const SmartCastInterface = styled.div`
  background: linear-gradient(135deg, #1e293b 0%, V9_COLORS.TEXT.GRAY_DARK 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin: 1rem 0;
  border: 2px solid V9_COLORS.TEXT.GRAY_DARK;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const SmartCastHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid V9_COLORS.TEXT.GRAY_DARK;
`;

const SmartCastTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: V9_COLORS.TEXT.WHITE;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SmartCastStatus = styled.div<{ $status: string }>`
  background: ${(props) => {
		switch (props.$status) {
			case 'pending':
				return 'V9_COLORS.PRIMARY.YELLOW';
			case 'authorized':
				return 'V9_COLORS.PRIMARY.GREEN';
			case 'denied':
				return 'V9_COLORS.PRIMARY.RED';
			case 'expired':
				return 'V9_COLORS.TEXT.GRAY_MEDIUM';
			default:
				return 'V9_COLORS.TEXT.GRAY_MEDIUM';
		}
	}};
  color: V9_COLORS.TEXT.WHITE;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// App Grid (like SmartCast home screen)
const AppGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const AppIcon = styled.div<{ $color: string }>`
  aspect-ratio: 1;
  background: ${({ $color }) => $color};
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: V9_COLORS.TEXT.WHITE;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s ease;
  padding: 0.5rem;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const AppLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  margin-top: 0.25rem;
  text-align: center;
`;

// Authorization Code Display
const AuthCodeDisplay = styled.div`
  background: V9_COLORS.TEXT.BLACK;
  color: #00ff00;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #00ff00;
  border: 2px solid #00ff00;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 0, 0.2),
    0 0 20px rgba(0, 255, 0, 0.3);
  text-align: center;
`;

// QR Code Section
const QRCodeSection = styled.div`
  background: V9_COLORS.TEXT.WHITE;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin: 1rem 0;
  border: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const QRTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin-bottom: 0.5rem;
`;

const QRSubtitle = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  margin-bottom: 1rem;
`;

const QRCodeContainer = styled.div`
  display: inline-block;
  padding: 1rem;
  background: V9_COLORS.TEXT.WHITE;
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
  background: ${(props) => (props.$variant === 'primary' ? 'V9_COLORS.PRIMARY.BLUE' : 'V9_COLORS.TEXT.GRAY_MEDIUM')};
  color: V9_COLORS.TEXT.WHITE;
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
  background: linear-gradient(135deg, V9_COLORS.PRIMARY.GREEN 0%, V9_COLORS.PRIMARY.GREEN_DARK 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-top: 1rem;
  text-align: center;
  color: V9_COLORS.TEXT.WHITE;
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

interface VizioTVDeviceFlowProps {
	state: DeviceFlowState;
	onStateUpdate: (newState: DeviceFlowState) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onComplete: (tokens: any) => void;
	onError: (error: string) => void;
}

const VizioTVDeviceFlow: React.FC<VizioTVDeviceFlowProps> = ({
	state,
	onStateUpdate,
	onComplete,
	onError,
}) => {
	const handleCopyUserCode = () => {
		navigator.clipboard.writeText(state.userCode);
		logger.info('VizioTVDeviceFlow', 'User code copied to clipboard');
	};

	const handleOpenVerificationUri = () => {
		window.open(state.verificationUriComplete, '_blank');
		logger.info('VizioTVDeviceFlow', 'Verification URI opened in new tab');
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
				return 'SmartCast Connected';
			case 'denied':
				return 'Connection Denied';
			case 'expired':
				return 'Session Expired';
			default:
				return 'Unknown Status';
		}
	};

	// VIZIO SmartCast apps
	const smartCastApps = [
		{ label: 'Netflix', icon: '🎬', color: '#e50914' },
		{ label: 'Disney+', icon: '🏰', color: '#113ccf' },
		{ label: 'Hulu', icon: '📺', color: '#1ce783' },
		{ label: 'Prime Video', icon: '📹', color: '#00a8e1' },
		{ label: 'YouTube TV', icon: '📺', color: '#ff0000' },
		{ label: 'Apple TV+', icon: '🍎', color: 'V9_COLORS.TEXT.BLACK' },
		{ label: 'HBO Max', icon: '🎭', color: '#673ab7' },
		{ label: 'SmartCast', icon: '⚙️', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' },
	];

	return (
		<>
			<VizioTVContainer>
				{/* VIZIO TV Screen */}
				<TVScreen $showContent={true}>
					{/* VIZIO Branding */}
					<VizioBranding>
						<VizioLogo>VIZIO</VizioLogo>
						<VizioModel>V-Series 4K</VizioModel>
					</VizioBranding>

					{/* Status Indicators */}
					<StatusIndicators>
						<StatusIndicator $active={true} $color="V9_COLORS.PRIMARY.GREEN" />
						<StatusIndicator $active={true} $color="V9_COLORS.PRIMARY.BLUE" />
						<StatusIndicator
							$active={state.status === 'authorized'}
							$color="V9_COLORS.PRIMARY.YELLOW"
						/>
					</StatusIndicators>

					{/* SmartCast Interface */}
					<SmartCastInterface>
						<SmartCastHeader>
							<SmartCastTitle>
								<FiPlay />
								SmartCast Home
							</SmartCastTitle>
							<SmartCastStatus $status={state.status}>
								{getStatusIcon()}
								{getStatusText()}
							</SmartCastStatus>
						</SmartCastHeader>

						{/* App Grid */}
						<AppGrid>
							{smartCastApps.map((app) => (
								<AppIcon key={app.label} $color={app.color}>
									<span style={{ fontSize: '1.5rem' }}>{app.icon}</span>
									<AppLabel>{app.label}</AppLabel>
								</AppIcon>
							))}
						</AppGrid>

						{/* Authorization Code Display */}
						<AuthCodeDisplay>{deviceFlowService.formatUserCode(state.userCode)}</AuthCodeDisplay>
					</SmartCastInterface>

					{/* QR Code Section */}
					<QRCodeSection>
						<QRTitle>Connect with VIZIO SmartCast Mobile</QRTitle>
						<QRSubtitle>Scan this QR code with your phone to complete setup</QRSubtitle>
						<QRCodeContainer>
							<QRCodeSVG
								value={state.verificationUriComplete}
								size={180}
								bgColor="V9_COLORS.TEXT.WHITE"
								fgColor="V9_COLORS.TEXT.GRAY_DARK"
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
								SmartCast Connected Successfully!
							</SuccessTitle>
							<SuccessMessage>
								Your VIZIO TV is now connected and ready to stream your favorite content.
							</SuccessMessage>
						</SuccessDisplay>
					)}
				</TVScreen>
			</VizioTVContainer>

			{/* Token Display Section - RENDERED OUTSIDE container to be truly independent */}
			<StandardizedTokenDisplay
				tokens={state.tokens}
				backgroundColor="rgba(0, 0, 0, 0.2)"
				borderColor="#3a3a3c"
				headerTextColor="V9_COLORS.TEXT.WHITE"
			/>
		</>
	);
};

export default VizioTVDeviceFlow;
