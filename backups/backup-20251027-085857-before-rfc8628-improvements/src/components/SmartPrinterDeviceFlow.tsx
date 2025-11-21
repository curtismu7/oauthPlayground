// src/components/SmartPrinterDeviceFlow.tsx
// Smart Printer Style Device Authorization Flow Interface

import { QRCodeSVG } from 'qrcode.react';
import React from 'react';
import {
	FiAlertTriangle,
	FiArrowLeft,
	FiArrowRight,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiFileText,
	FiMaximize2,
	FiMove,
	FiPaperclip,
	FiPrinter,
	FiRefreshCw,
	FiTrash2,
	FiXCircle,
} from 'react-icons/fi';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import InlineTokenDisplay from './InlineTokenDisplay';

// HP LaserJet Physical Printer Housing - Authentic HP Design
const SmartPrinterContainer = styled.div<{ $authorized?: boolean }>`
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  position: relative;
  color: #1e293b;
`;

// HP LaserJet Display Screen - Physical LCD Display
const PrinterDisplayScreen = styled.div`
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border-radius: 0.5rem;
  padding: 0;
  margin-bottom: 1.5rem;
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.1),
    0 0 0 3px #1e293b;
  border: 3px solid #cbd5e1;
  overflow: hidden;
  position: relative;
  min-height: 400px;
`;

const PrinterDisplayHeader = styled.div`
  background: linear-gradient(90deg, #00a86b 0%, #00cc6a 100%);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HPDisplayText = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 1px;
`;

const DisplayStatus = styled.div<{ $authorized?: boolean }>`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $authorized }) => ($authorized ? '#00ff88' : '#ffffff')};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PrinterTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const PrinterSubtitle = styled.div`
  font-size: 1rem;
  color: #67e8f9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// Screen Label
const ScreenLabel = styled.div`
  /* Use inline styles for flexibility */
`;

// User Code Display
const UserCodeDisplay = styled.div`
  background: rgba(0, 0, 0, 0.05);
  color: #1e293b;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 3rem;
  font-weight: 700;
  padding: 2rem 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.3em;
  text-align: center;
  border: 2px solid #e2e8f0;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.1);
`;

// HP Floating Toolbar - matches HP Smart App interface
const HPFloatingToolbar = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10;
  backdrop-filter: blur(10px);
`;

const ToolbarButton = styled.button<{
	$variant: 'move' | 'expand' | 'back' | 'delete' | 'forward';
}>`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ $variant }) => {
		switch ($variant) {
			case 'move':
				return '#6b7280';
			case 'expand':
				return '#3b82f6';
			case 'back':
				return '#6b7280';
			case 'delete':
				return '#ef4444';
			case 'forward':
				return '#10b981';
			default:
				return '#6b7280';
		}
	}};
  color: white;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

// Printer Status Indicators
const PrinterStatusIndicators = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const PrinterStatusIndicator = styled.div<{ $active: boolean; $color: string }>`
  width: 14px;
  height: 14px;
  border-radius: 2px;
  background: ${(props) => (props.$active ? props.$color : '#374151')};
  box-shadow: ${(props) => (props.$active ? `0 0 15px ${props.$color}` : 'none')};
  animation: ${(props) => (props.$active ? 'printerBlink 2s infinite' : 'none')};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    border-radius: 1px;
    background: ${(props) => (props.$active ? '#ffffff' : 'transparent')};
    animation: ${(props) => (props.$active ? 'innerBlink 1s infinite' : 'none')};
  }
  
  @keyframes printerBlink {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.6; 
      transform: scale(1.05);
    }
  }
  
  @keyframes innerBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
  }
`;

// QR Code Section
const QRCodeSection = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.75rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const QRCodeLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
`;

// Printer Control Panel
const PrinterControlPanel = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const PrinterControlButton = styled.button<{
	$variant: 'primary' | 'secondary' | 'success' | 'danger';
}>`
  background: ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return '#22d3ee';
			case 'secondary':
				return '#374151';
			case 'success':
				return '#f97316';
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
				return '#ea580c';
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
				return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
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
				return '#ea580c';
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

// Printer Base
const PrinterBase = styled.div`
  background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
  height: 1.5rem;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 0 -2rem -2rem -2rem;
  border-top: 2px solid #22d3ee;
`;

interface SmartPrinterDeviceFlowProps {
	state: DeviceFlowState;
	onStateUpdate: (newState: DeviceFlowState) => void;
	onComplete: (tokens: any) => void;
	onError: (error: string) => void;
}

const SmartPrinterDeviceFlow: React.FC<SmartPrinterDeviceFlowProps> = ({
	state,
	onStateUpdate,
	onComplete,
	onError,
}) => {
	const handleCopyUserCode = () => {
		navigator.clipboard.writeText(state.userCode);
		logger.info('SmartPrinterDeviceFlow', 'User code copied to clipboard');
	};

	const handleCopyVerificationUri = () => {
		navigator.clipboard.writeText(state.verificationUri);
		logger.info('SmartPrinterDeviceFlow', 'Verification URI copied to clipboard');
	};

	const handleOpenVerificationUri = () => {
		window.open(state.verificationUriComplete, '_blank');
		logger.info('SmartPrinterDeviceFlow', 'Verification URI opened in new tab');
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
				return 'CONNECTING TO ACCOUNT';
			case 'authorized':
				return 'PRINTER AUTHORIZED';
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

	const isAuthorized = state.status === 'authorized';

	return (
		<SmartPrinterContainer $authorized={isAuthorized}>
			{/* HP Printer Display Screen */}
			<PrinterDisplayScreen>
				<PrinterDisplayHeader>
					<HPDisplayText>HP LaserJet M140we</HPDisplayText>
					<DisplayStatus $authorized={isAuthorized}>
						{state.status === 'authorized'
							? 'READY'
							: state.status === 'pending'
								? 'AUTHORIZING'
								: state.status === 'denied'
									? 'DENIED'
									: 'IDLE'}
					</DisplayStatus>
				</PrinterDisplayHeader>

				<div style={{ padding: '1.5rem' }}>
					<PrinterTitle>
						<FiPrinter style={{ marginRight: '0.5rem', color: '#00a86b' }} />
						Authorization Required
					</PrinterTitle>

					{/* User Code Display */}
					<ScreenLabel
						style={{
							color: '#64748b',
							fontSize: '0.875rem',
							fontWeight: 600,
							marginBottom: '0.5rem',
							marginTop: '1rem',
						}}
					>
						Document Authorization Code
					</ScreenLabel>
					<UserCodeDisplay>{deviceFlowService.formatUserCode(state.userCode)}</UserCodeDisplay>

					{/* QR Code Section */}
					<QRCodeSection>
						<QRCodeLabel>
							<FiFileText style={{ marginRight: '0.5rem' }} />
							Document Scanner
						</QRCodeLabel>
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

					{/* Printer Control Panel */}
					<PrinterControlPanel>
						<PrinterControlButton $variant="secondary" onClick={handleCopyUserCode}>
							<FiCopy /> Copy Code
						</PrinterControlButton>
						<PrinterControlButton $variant="secondary" onClick={handleCopyVerificationUri}>
							<FiCopy /> Copy URI
						</PrinterControlButton>
						<PrinterControlButton $variant="primary" onClick={handleOpenVerificationUri}>
							<FiExternalLink /> Authorize
						</PrinterControlButton>
					</PrinterControlPanel>

					{/* Status Display */}
					<StatusDisplay $status={state.status}>
						<StatusIcon>{getStatusIcon()}</StatusIcon>
						<StatusText>{getStatusText()}</StatusText>
						<StatusMessage>{getStatusMessage()}</StatusMessage>
					</StatusDisplay>
				</div>
			</PrinterDisplayScreen>

			{/* Success Display - Realistic Printer Interface */}
			{state.status === 'authorized' && state.tokens && (
				<div
					style={{
						background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
						border: '3px solid #22d3ee',
						borderRadius: '1rem',
						padding: '2rem',
						marginTop: '1rem',
						boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
					}}
				>
					{/* Printer Header */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: '1.5rem',
							paddingBottom: '1rem',
							borderBottom: '2px solid #cbd5e1',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
							<div
								style={{
									width: '40px',
									height: '40px',
									background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
									borderRadius: '0.5rem',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: 'white',
									fontSize: '1.25rem',
								}}
							>
								🖨️
							</div>
							<div>
								<div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>
									HP OfficeJet Pro 9015e
								</div>
								<div style={{ fontSize: '0.875rem', color: '#64748b' }}>
									All-in-One Printer • Ready
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

					{/* Printer Status Panel */}
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(3, 1fr)',
							gap: '1rem',
							marginBottom: '1.5rem',
						}}
					>
						<div
							style={{
								background: 'white',
								padding: '1rem',
								borderRadius: '0.5rem',
								border: '1px solid #e2e8f0',
								textAlign: 'center',
							}}
						>
							<div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📄</div>
							<div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>Paper</div>
							<div style={{ fontSize: '0.75rem', color: '#10b981' }}>Full</div>
						</div>
						<div
							style={{
								background: 'white',
								padding: '1rem',
								borderRadius: '0.5rem',
								border: '1px solid #e2e8f0',
								textAlign: 'center',
							}}
						>
							<div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🖨️</div>
							<div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>Ink</div>
							<div style={{ fontSize: '0.75rem', color: '#10b981' }}>85%</div>
						</div>
						<div
							style={{
								background: 'white',
								padding: '1rem',
								borderRadius: '0.5rem',
								border: '1px solid #e2e8f0',
								textAlign: 'center',
							}}
						>
							<div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📶</div>
							<div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>WiFi</div>
							<div style={{ fontSize: '0.75rem', color: '#10b981' }}>Connected</div>
						</div>
					</div>

					{/* Print Queue */}
					<div
						style={{
							background: 'white',
							borderRadius: '0.75rem',
							padding: '1.5rem',
							border: '1px solid #e2e8f0',
							marginBottom: '1.5rem',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: '1rem',
							}}
						>
							<h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1e293b' }}>
								Print Queue
							</h3>
							<div
								style={{
									background: '#f0f9ff',
									color: '#0369a1',
									padding: '0.25rem 0.75rem',
									borderRadius: '0.375rem',
									fontSize: '0.75rem',
									fontWeight: '600',
								}}
							>
								3 Jobs
							</div>
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									padding: '0.75rem',
									background: '#f8fafc',
									borderRadius: '0.5rem',
									border: '1px solid #e2e8f0',
								}}
							>
								<div style={{ fontSize: '1.25rem' }}>📄</div>
								<div style={{ flex: 1 }}>
									<div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
										Q4_Report_Final.pdf
									</div>
									<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
										From: john.doe@company.com • 12 pages
									</div>
								</div>
								<div
									style={{
										background: '#fef3c7',
										color: '#92400e',
										padding: '0.25rem 0.5rem',
										borderRadius: '0.25rem',
										fontSize: '0.75rem',
										fontWeight: '600',
									}}
								>
									Printing
								</div>
							</div>

							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									padding: '0.75rem',
									background: '#f8fafc',
									borderRadius: '0.5rem',
									border: '1px solid #e2e8f0',
								}}
							>
								<div style={{ fontSize: '1.25rem' }}>📊</div>
								<div style={{ flex: 1 }}>
									<div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
										Sales_Presentation.pptx
									</div>
									<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
										From: sarah.smith@company.com • 8 pages
									</div>
								</div>
								<div
									style={{
										background: '#dbeafe',
										color: '#1e40af',
										padding: '0.25rem 0.5rem',
										borderRadius: '0.25rem',
										fontSize: '0.75rem',
										fontWeight: '600',
									}}
								>
									Queued
								</div>
							</div>
						</div>
					</div>

					{/* Quick Actions */}
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(2, 1fr)',
							gap: '1rem',
						}}
					>
						<button
							style={{
								background: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
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
							<FiFileText /> Scan Document
						</button>
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
							<FiPrinter /> Print Test Page
						</button>
					</div>
				</div>
			)}

			{/* Printer Base */}
			<PrinterBase />
		</SmartPrinterContainer>
	);
};

export default SmartPrinterDeviceFlow;
