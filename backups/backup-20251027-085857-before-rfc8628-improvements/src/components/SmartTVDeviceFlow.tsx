// src/components/SmartTVDeviceFlow.tsx
// Smart TV Style Device Authorization Flow Interface

import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiRefreshCw,
	FiTv,
	FiXCircle,
} from 'react-icons/fi';
import styled from 'styled-components';
import { DeviceFlowState, deviceFlowService } from '../services/deviceFlowService';
import { UnifiedTokenDisplayService } from '../services/unifiedTokenDisplayService';
import { logger } from '../utils/logger';

// Vizio TV Main Container - Authentic Vizio Design with Physical Housing
const SmartTVContainer = styled.div<{ $authorized?: boolean }>`
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  position: relative;
  color: #1e293b;
`;

// Vizio Smart TV Display Screen - Streaming Interface
const TVScreen = styled.div`
  background: linear-gradient(180deg, #141414 0%, #000000 100%);
  border: 3px solid #000000;
  border-radius: 0.5rem;
  padding: 0;
  margin-bottom: 1.5rem;
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.5),
    0 0 0 3px #2d2d2d;
  overflow: hidden;
  position: relative;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  color: #ffffff;
`;

// Streaming Service Navigation Bar
const StreamingNavBar = styled.div`
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 100%);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
`;

const StreamingLogo = styled.div`
  font-size: 1.75rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 0.05em;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
`;

const StreamingStatus = styled.div<{ $status: string }>`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $status }) =>
		$status === 'authorized' ? '#00ff88' : $status === 'pending' ? '#f59e0b' : '#999999'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: 1px solid ${({ $status }) =>
		$status === 'authorized'
			? '#00ff88'
			: $status === 'pending'
				? '#f59e0b'
				: 'rgba(255, 255, 255, 0.2)'};
`;

// Content Section
const StreamingContent = styled.div`
  padding: 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
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

const ContentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ContentTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.05em;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`;

const ContentCard = styled.div<{ $image: string }>`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 0.5rem;
  padding: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: scale(1.05);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
`;

const ContentImage = styled.div`
  width: 100%;
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ContentLabel = styled.div`
  font-size: 0.75rem;
  color: #999999;
  text-align: center;
`;

const AuthorizationSection = styled.div`
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(217, 70, 239, 0.1) 100%);
  border: 2px solid rgba(249, 115, 22, 0.3);
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
`;

const AuthorizationTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #f97316;
  margin-bottom: 1rem;
  letter-spacing: 0.05em;
`;

const AuthorizationCode = styled.div`
  background: rgba(0, 0, 0, 0.5);
  color: #f97316;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 4rem;
  font-weight: 700;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  letter-spacing: 0.3em;
  text-shadow: 0 0 20px rgba(249, 115, 22, 0.5);
  border: 2px solid rgba(249, 115, 22, 0.5);
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
		<SmartTVContainer>
			{/* Smart TV Display Screen */}
			<TVScreen>
				<StreamingNavBar>
					<StreamingLogo>STREAMFLIX</StreamingLogo>
					<StreamingStatus $status={state.status}>
						{state.status === 'authorized'
							? 'READY'
							: state.status === 'pending'
								? 'AUTHORIZING'
								: state.status === 'denied'
									? 'DENIED'
									: 'IDLE'}
					</StreamingStatus>
				</StreamingNavBar>

				<StreamingContent>
					{/* Authorization Section */}
					<AuthorizationSection>
						<AuthorizationTitle>Device Authorization</AuthorizationTitle>
						<AuthorizationCode>
							{deviceFlowService.formatUserCode(state.userCode)}
						</AuthorizationCode>
					</AuthorizationSection>

					{/* Content Grid */}
					<ContentSection>
						<ContentTitle>Continue Watching</ContentTitle>
						<ContentGrid>
							<ContentCard>
								<ContentImage>NEW</ContentImage>
								<ContentLabel>Latest</ContentLabel>
							</ContentCard>
							<ContentCard>
								<ContentImage>HOT</ContentImage>
								<ContentLabel>Trending</ContentLabel>
							</ContentCard>
							<ContentCard>
								<ContentImage>TOP</ContentImage>
								<ContentLabel>Popular</ContentLabel>
							</ContentCard>
							<ContentCard>
								<ContentImage>FAV</ContentImage>
								<ContentLabel>My List</ContentLabel>
							</ContentCard>
						</ContentGrid>
					</ContentSection>

					{/* QR Code Section */}
					<ContentSection>
						<ContentTitle>Scan to Continue</ContentTitle>
						<div style={{ display: 'flex', justifyContent: 'center' }}>
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
						</div>
					</ContentSection>
				</StreamingContent>
			</TVScreen>

			{/* Success Display */}
			{state.status === 'authorized' && state.tokens && (
				<div
					style={{
						background: '#1a1a1a',
						border: '2px solid #00ff00',
						borderRadius: '0.75rem',
						padding: '1.5rem',
						marginTop: '1rem',
					}}
				>
					<div
						style={{
							fontSize: '1.25rem',
							fontWeight: '700',
							color: '#00ff00',
							textAlign: 'center',
							marginBottom: '1rem',
						}}
					>
						<FiCheckCircle style={{ marginRight: '0.5rem' }} />
						Authorization Successful!
					</div>
					{/* Token Display - Full Width Independent of Device */}
					<div
						style={{
							width: '100%',
							maxWidth: '60rem',
							margin: '1rem auto',
						}}
					>
						{UnifiedTokenDisplayService.showTokens(
							state.tokens as any,
							'oauth',
							'device-authorization-v7',
							{
								showCopyButtons: true,
								showDecodeButtons: true,
								inlineDecode: true,
							}
						)}
					</div>
				</div>
			)}

			{/* TV Stand */}
			<TVStand />
		</SmartTVContainer>
	);
};

export default SmartTVDeviceFlow;
