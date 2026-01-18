// src/components/AirportKioskDeviceFlow.tsx
// Airport Check-in Kiosk Style Device Authorization Flow Interface
// Designed to look like CLEAR/TSA biometric kiosks

import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import {
	FiAlertTriangle,
	FiCamera,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiUser,
	FiXCircle,
} from 'react-icons/fi';
import styled from 'styled-components';
import {
	DeviceFlowState,
	type DeviceTokenResponse,
	deviceFlowService,
} from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import StandardizedTokenDisplay from './StandardizedTokenDisplay';

// Airport Kiosk Main Container - Looks like a physical kiosk with bezel
const KioskContainer = styled.div`
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-radius: 2rem;
  padding: 3rem;
  margin: 2rem 0;
  box-shadow: 
    0 30px 60px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 16px solid #0f172a;
  position: relative;
  
  /* Simulated kiosk bezel/frame */
  &::before {
    content: '';
    position: absolute;
    top: -16px;
    left: -16px;
    right: -16px;
    bottom: -16px;
    border-radius: 2rem;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%);
    z-index: -1;
    box-shadow: 
      0 0 40px rgba(0, 0, 0, 0.5),
      inset 0 2px 4px rgba(255, 255, 255, 0.1);
  }
  
  /* Simulated camera lens at top */
  &::after {
    content: '📷';
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    width: 32px;
    height: 32px;
    background: radial-gradient(circle, #1e40af 0%, #1e3a8a 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    box-shadow: 
      0 0 20px rgba(30, 64, 175, 0.5),
      inset 0 0 10px rgba(59, 130, 246, 0.3);
  }
`;

// LCD Screen Container - Main display area
const LCDScreen = styled.div`
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border-radius: 1rem;
  padding: 0;
  margin: 1.5rem 0;
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.1),
    0 0 0 3px #1e293b;
  border: 4px solid #cbd5e1;
  overflow: hidden;
  position: relative;
  min-height: 600px;
`;

// CLEAR Branding Bar
const CLEARBrandBar = styled.div`
  background: linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%);
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const CLEARLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #ffffff;
`;

const CLEARLogoText = styled.div`
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const TSABadge = styled.div`
  background: #ffffff;
  color: #1e40af;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

// Biometric Scanner Area (like CLEAR iris scanner)
const BiometricScanner = styled.div`
  position: absolute;
  top: 6rem;
  right: 2rem;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, #1e40af 0%, #1e3a8a 60%, #0f172a 100%);
  border-radius: 50%;
  border: 4px solid #3b82f6;
  box-shadow: 
    0 0 40px rgba(59, 130, 246, 0.6),
    inset 0 0 30px rgba(30, 64, 175, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% {
      box-shadow: 
        0 0 40px rgba(59, 130, 246, 0.6),
        inset 0 0 30px rgba(30, 64, 175, 0.4);
    }
    50% {
      box-shadow: 
        0 0 60px rgba(59, 130, 246, 0.8),
        inset 0 0 40px rgba(30, 64, 175, 0.6);
    }
  }
`;

const ScannerIcon = styled.div`
  font-size: 3rem;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
`;

const ScannerLabel = styled.div`
  position: absolute;
  bottom: -2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #0ea5e9;
  color: #ffffff;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const KioskStatusBadge = styled.div<{ $status: string }>`
  background: ${(props) => {
		switch (props.$status) {
			case 'pending':
				return '#fef3c7';
			case 'authorized':
				return '#d1fae5';
			case 'denied':
				return '#fee2e2';
			case 'expired':
				return '#f3f4f6';
			default:
				return '#f3f4f6';
		}
	}};
  border: 2px solid ${(props) => {
		switch (props.$status) {
			case 'pending':
				return '#f59e0b';
			case 'authorized':
				return '#10b981';
			case 'denied':
				return '#ef4444';
			case 'expired':
				return '#9ca3af';
			default:
				return '#9ca3af';
		}
	}};
  color: ${(props) => {
		switch (props.$status) {
			case 'pending':
				return '#92400e';
			case 'authorized':
				return '#065f46';
			case 'denied':
				return '#991b1b';
			case 'expired':
				return '#374151';
			default:
				return '#374151';
		}
	}};
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// Kiosk Main Display
const KioskDisplay = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// Passenger Information Panel
const PassengerPanel = styled.div`
  background: #ffffff;
  border: 2px solid #cbd5e1;
  border-radius: 1rem;
  padding: 2rem;
`;

const PanelTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
`;

const InfoValue = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #0f172a;
`;

// Boarding Pass Panel
const BoardingPassPanel = styled.div`
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  border-radius: 1rem;
  padding: 2rem;
  color: #ffffff;
  box-shadow: 0 10px 25px rgba(30, 64, 175, 0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.1), transparent);
    pointer-events: none;
  }
`;

const BoardingTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #bfdbfe;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
`;

const BoardingValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 1.5rem;
`;

const BoardingDivider = styled.div`
  height: 1px;
  background: rgba(191, 219, 254, 0.3);
  margin: 1rem 0;
`;

const CodeDisplay = styled.div`
  background: rgba(15, 23, 42, 0.5);
  border: 2px solid rgba(191, 219, 254, 0.3);
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
  margin-top: 1.5rem;
`;

const CodeLabel = styled.div`
  font-size: 0.75rem;
  color: #bfdbfe;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const CodeValue = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.2em;
`;

// QR Code Section
const QRSection = styled.div`
  background: #ffffff;
  border: 2px solid #cbd5e1;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  grid-column: 1 / -1;
`;

const QRTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1rem;
`;

const QRSubtitle = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 1.5rem;
`;

const QRCodeContainer = styled.div`
  display: inline-block;
  padding: 1rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

// Action Buttons
const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' | 'success' }>`
  background: ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return '#3b82f6';
			case 'secondary':
				return '#64748b';
			case 'success':
				return '#22c55e';
			default:
				return '#64748b';
		}
	}};
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.875rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

// Status Message
const StatusMessage = styled.div<{ $status: string }>`
  background: ${(props) => {
		switch (props.$status) {
			case 'pending':
				return 'rgba(245, 158, 11, 0.1)';
			case 'authorized':
				return 'rgba(34, 197, 94, 0.1)';
			case 'denied':
				return 'rgba(239, 68, 68, 0.1)';
			case 'expired':
				return 'rgba(107, 114, 128, 0.1)';
			default:
				return 'rgba(107, 114, 128, 0.1)';
		}
	}};
  border: 2px solid ${(props) => {
		switch (props.$status) {
			case 'pending':
				return '#f59e0b';
			case 'authorized':
				return '#22c55e';
			case 'denied':
				return '#ef4444';
			case 'expired':
				return '#6b7280';
			default:
				return '#6b7280';
		}
	}};
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const StatusIcon = styled.div<{ $status: string }>`
  font-size: 1.5rem;
  color: ${(props) => {
		switch (props.$status) {
			case 'pending':
				return '#f59e0b';
			case 'authorized':
				return '#22c55e';
			case 'denied':
				return '#ef4444';
			case 'expired':
				return '#6b7280';
			default:
				return '#6b7280';
		}
	}};
`;

const StatusText = styled.div`
  flex: 1;
`;

const StatusTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
`;

const StatusDescription = styled.div`
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
`;

interface AirportKioskDeviceFlowProps {
	state: DeviceFlowState;
	onStateUpdate: (newState: DeviceFlowState) => void;
	onComplete: (tokens: DeviceTokenResponse) => void;
	onError: (error: string) => void;
}

const AirportKioskDeviceFlow: React.FC<AirportKioskDeviceFlowProps> = ({
	state,
	onStateUpdate: _onStateUpdate,
	onComplete: _onComplete,
	onError: _onError,
}) => {
	const handleCopyUserCode = () => {
		navigator.clipboard.writeText(state.userCode);
		logger.info('AirportKioskDeviceFlow', 'User code copied to clipboard');
	};

	const handleOpenVerificationUri = () => {
		window.open(state.verificationUriComplete, '_blank');
		logger.info('AirportKioskDeviceFlow', 'Verification URI opened in new tab');
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
				return 'Authorization Pending';
			case 'authorized':
				return 'Check-in Complete';
			case 'denied':
				return 'Authorization Denied';
			case 'expired':
				return 'Session Expired';
			default:
				return 'Unknown Status';
		}
	};

	const getStatusBadge = () => {
		switch (state.status) {
			case 'pending':
				return 'Awaiting Confirmation';
			case 'authorized':
				return 'Check-in Complete';
			case 'denied':
				return 'Access Denied';
			case 'expired':
				return 'Session Expired';
			default:
				return 'Unknown';
		}
	};

	return (
		<>
			<KioskContainer>
				{/* LCD Touchscreen Display */}
				<LCDScreen>
					{/* CLEAR Branding Bar */}
					<CLEARBrandBar>
						<CLEARLogo>
							<span style={{ fontSize: '2rem' }}>👁️</span>
							<CLEARLogoText>CLEAR</CLEARLogoText>
						</CLEARLogo>
						<div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
							<TSABadge>
								<FiUser />
								TSA PreCheck®
							</TSABadge>
							<KioskStatusBadge $status={state.status}>
								{getStatusIcon()}
								{getStatusBadge()}
							</KioskStatusBadge>
						</div>
					</CLEARBrandBar>

					{/* Biometric Scanner (like CLEAR iris scanner) */}
					<BiometricScanner>
						<ScannerIcon>
							<FiCamera />
						</ScannerIcon>
						<ScannerLabel>Iris Scanner</ScannerLabel>
					</BiometricScanner>

					{/* Main Kiosk Display */}
					<KioskDisplay>
						{/* Passenger Information Panel */}
						<PassengerPanel>
							<PanelTitle>Check-in Information</PanelTitle>
							<InfoRow>
								<InfoLabel>Flight</InfoLabel>
								<InfoValue>P1 204 → San Francisco</InfoValue>
							</InfoRow>
							<InfoRow>
								<InfoLabel>Departure</InfoLabel>
								<InfoValue>Today, 10:45 AM</InfoValue>
							</InfoRow>
							<InfoRow>
								<InfoLabel>Gate</InfoLabel>
								<InfoValue>B12</InfoValue>
							</InfoRow>
							<InfoRow>
								<InfoLabel>Boarding</InfoLabel>
								<InfoValue>10:20 AM</InfoValue>
							</InfoRow>
							<InfoRow>
								<InfoLabel>Status</InfoLabel>
								<InfoValue>
									{state.status === 'authorized' ? 'Ready to Board' : 'Pending'}
								</InfoValue>
							</InfoRow>
						</PassengerPanel>

						{/* Boarding Pass Panel */}
						<BoardingPassPanel>
							<BoardingTitle>Passenger</BoardingTitle>
							<BoardingValue>Demo Traveler</BoardingValue>

							<BoardingDivider />

							<BoardingTitle>Seat Assignment</BoardingTitle>
							<BoardingValue>12A • Window</BoardingValue>

							<BoardingDivider />

							<BoardingTitle>Baggage</BoardingTitle>
							<BoardingValue>2 Checked • 1 Carry-on</BoardingValue>

							<CodeDisplay>
								<CodeLabel>Authorization Code</CodeLabel>
								<CodeValue>{deviceFlowService.formatUserCode(state.userCode)}</CodeValue>
							</CodeDisplay>
						</BoardingPassPanel>

						{/* QR Code Section */}
						<QRSection>
							<QRTitle>Complete Check-in on Your Mobile Device</QRTitle>
							<QRSubtitle>
								Scan the QR code below with your smartphone to authorize check-in
							</QRSubtitle>
							<QRCodeContainer>
								<QRCodeSVG
									value={state.verificationUriComplete}
									size={200}
									bgColor="#ffffff"
									fgColor="#0f172a"
									level="H"
									includeMargin={true}
								/>
							</QRCodeContainer>
							<ActionButtons>
								<ActionButton $variant="secondary" onClick={handleCopyUserCode}>
									<FiCopy /> Copy Code
								</ActionButton>
								<ActionButton $variant="primary" onClick={handleOpenVerificationUri}>
									<FiExternalLink /> Open on This Device
								</ActionButton>
							</ActionButtons>
						</QRSection>
					</KioskDisplay>

					{/* Status Message */}
					<StatusMessage $status={state.status}>
						<StatusIcon $status={state.status}>{getStatusIcon()}</StatusIcon>
						<StatusText>
							<StatusTitle>{getStatusText()}</StatusTitle>
							<StatusDescription>{deviceFlowService.getStatusMessage(state)}</StatusDescription>
						</StatusText>
					</StatusMessage>

					{/* Success Display */}
					{state.status === 'authorized' && state.tokens && (
						<div
							style={{
								background: 'rgba(34, 197, 94, 0.1)',
								border: '2px solid #22c55e',
								borderRadius: '1rem',
								padding: '2rem',
								marginTop: '1rem',
							}}
						>
							<div
								style={{
									fontSize: '1.25rem',
									fontWeight: '700',
									color: '#065f46',
									textAlign: 'center',
									marginBottom: '1rem',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '0.5rem',
								}}
							>
								<FiCheckCircle />
								Boarding Pass Ready - Proceed to Security
							</div>
						</div>
					)}
				</LCDScreen>
			</KioskContainer>

			{/* Token Display Section - RENDERED OUTSIDE container to be truly independent */}
			<StandardizedTokenDisplay
				tokens={state.tokens}
				backgroundColor="#ffffff"
				borderColor="#cbd5e1"
				headerTextColor="#1e293b"
			/>
		</>
	);
};

export default AirportKioskDeviceFlow;
