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
	FiMaximize,
	FiMaximize2,
	FiMove,
	FiPrinter,
	FiTrash,
	FiTrash2,
	FiXCircle
} from '@icons';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { logger } from '../utils/logger';
import StandardizedTokenDisplay from './StandardizedTokenDisplay';

// HP Smart App Interface - Authentic HP Design with Green Theme
const SmartPrinterContainer = styled.div<{ $authorized?: boolean }>`
  background: ${({ $authorized }) =>
		$authorized
			? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 50%, #00ff88 100%)'
			: 'linear-gradient(135deg, #00a86b 0%, #00cc6a 50%, #00a86b 100%)'};
  border-radius: 1rem;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.2),
    0 0 0 1px ${({ $authorized }) => ($authorized ? '#00ff88' : '#00a86b')},
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  border: 2px solid ${({ $authorized }) => ($authorized ? '#00ff88' : '#00a86b')};
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  color: #ffffff;
  transition: all 0.3s ease;
  
  /* HP Smart App green interface with scanline effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 1rem;
    background: ${({ $authorized }) =>
			$authorized
				? 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 204, 106, 0.1) 100%)'
				: 'linear-gradient(135deg, rgba(0, 168, 107, 0.9) 0%, rgba(0, 204, 106, 0.8) 100%)'};
    pointer-events: none;
  }
  
  /* HP logo area - top left corner */
  &::after {
    content: 'HP';
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-size: 1.25rem;
    font-weight: 800;
    color: #000000;
    letter-spacing: 2px;
    z-index: 3;
  }
`;

// HP LaserJet MFP M140we Printer Header
const PrinterHeader = styled.div<{ $authorized?: boolean }>`
  background: ${({ $authorized }) =>
		$authorized
			? 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)'
			: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'};
  border: 1px solid ${({ $authorized }) => ($authorized ? '#00ff88' : '#3a3a3c')};
  border-radius: 0.25rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
  color: ${({ $authorized }) => ($authorized ? '#000000' : '#ffffff')};
  font-weight: 600;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
`;

const PrinterTitle = styled.div<{ $authorized?: boolean }>`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ $authorized }) => ($authorized ? '#000000' : '#ffffff')};
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
`;

const PrinterSubtitle = styled.div`
  font-size: 1rem;
  color: #67e8f9;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// HP Floating Toolbar - matches HP Smart App interface
const HPFloatingToolbar = styled.div`
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  margin: 1rem auto;
  max-width: fit-content;
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

// Printer Display Screen
const PrinterDisplayScreen = styled.div`
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
  color: #f97316;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 10px #f97316;
  border: 2px solid #f97316;
  box-shadow: 
    inset 0 0 20px rgba(249, 115, 22, 0.2),
    0 0 20px rgba(249, 115, 22, 0.3);
`;

// QR Code Section
const QRCodeSection = styled.div`
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 2;
`;

const QRCodeLabel = styled.div`
  font-size: 1rem;
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
  position: relative;
  z-index: 2;
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
		<>
			<SmartPrinterContainer $authorized={isAuthorized}>
				{/* Printer Header */}
				<PrinterHeader $authorized={isAuthorized}>
					<PrinterTitle $authorized={isAuthorized}>
						<FiPrinter style={{ marginRight: '0.5rem' }} />
						HP LaserJet MFP M140we
					</PrinterTitle>
					<PrinterSubtitle>Secure Document Release System</PrinterSubtitle>
				</PrinterHeader>

				{/* Printer Status Indicators */}
				<PrinterStatusIndicators>
					<PrinterStatusIndicator $active={state.status === 'pending'} $color="#f59e0b" />
					<PrinterStatusIndicator $active={state.status === 'authorized'} $color="#f97316" />
					<PrinterStatusIndicator $active={state.status === 'denied'} $color="#ef4444" />
					<PrinterStatusIndicator $active={state.status === 'expired'} $color="#6b7280" />
				</PrinterStatusIndicators>

				{/* HP Floating Toolbar */}
				<HPFloatingToolbar>
					<ToolbarButton $variant="move" title="Move">
						<FiMove />
					</ToolbarButton>
					<ToolbarButton $variant="expand" title="Expand">
						<FiMaximize2 />
					</ToolbarButton>
					<ToolbarButton $variant="back" title="Back">
						<FiArrowLeft />
					</ToolbarButton>
					<ToolbarButton $variant="delete" title="Delete">
						<FiTrash2 />
					</ToolbarButton>
					<ToolbarButton $variant="forward" title="Forward">
						<FiArrowRight />
					</ToolbarButton>
				</HPFloatingToolbar>

				{/* Printer Display Screen */}
				<PrinterDisplayScreen style={{ position: 'relative', zIndex: 2 }}>
					<ScreenLabel>Document Authorization Code</ScreenLabel>
					<UserCodeDisplay>{deviceFlowService.formatUserCode(state.userCode)}</UserCodeDisplay>
				</PrinterDisplayScreen>

				{/* QR Code Section */}
				{state.verificationUriComplete && (
					<QRCodeSection>
						<QRCodeLabel>
							<FiFileText style={{ marginRight: '0.5rem' }} />
							Document Scanner
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
				)}

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
						<PrinterControlButton
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
						</PrinterControlButton>
					</div>
				)}

				{/* Printer Control Panel */}
				<PrinterControlPanel>
					<PrinterControlButton $variant="secondary" onClick={handleCopyUserCode}>
						<FiCopy /> Copy Code
					</PrinterControlButton>
					<PrinterControlButton $variant="secondary" onClick={handleCopyVerificationUri}>
						<FiCopy /> Copy URI
					</PrinterControlButton>
				</PrinterControlPanel>

				{/* Status Display */}
				<StatusDisplay $status={state.status}>
					<StatusIcon>{getStatusIcon()}</StatusIcon>
					<StatusText>{getStatusText()}</StatusText>
					<StatusMessage>{getStatusMessage()}</StatusMessage>
				</StatusDisplay>

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
								<div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
									Paper
								</div>
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
								<div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
									WiFi
								</div>
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
								<h3
									style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1e293b' }}
								>
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

			{/* Token Display Section - RENDERED OUTSIDE container to be truly independent */}
			<StandardizedTokenDisplay
				tokens={state.tokens}
				backgroundColor="rgba(255, 255, 255, 0.95)"
				borderColor="#e2e8f0"
				headerTextColor="#1e293b"
			/>
		</>
	);
};

export default SmartPrinterDeviceFlow;
