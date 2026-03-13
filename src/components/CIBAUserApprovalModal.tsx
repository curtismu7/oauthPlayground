/**
 * @file CIBAUserApprovalModal.tsx
 * @module components
 * @description Modal to simulate CIBA user approval on mobile device
 * @version 1.0.0
 * @since 2026-03-11
 *
 * Shows a realistic phone interface for user approval simulation
 * when "Simulate User Approval (Out-of-Band)" is clicked in CIBA flow.
 */

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { DraggableModal } from './DraggableModal';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// Phone mockup styling
const PhoneContainer = styled.div`
  width: 320px;
  height: 640px;
  background: #1a1a1a;
  border-radius: 40px;
  padding: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  margin: 0 auto;
  
  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 6px;
    background: #333;
    border-radius: 3px;
  }
`;

const PhoneScreen = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 28px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const StatusBar = styled.div`
  height: 24px;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: white;
  font-size: 12px;
  font-weight: 500;
`;

const AppContent = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
`;

const AppLogo = styled.div`
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin-bottom: 20px;
  animation: ${pulse} 2s infinite;
`;

const AppTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  text-align: center;
`;

const AppSubtitle = styled.p`
  font-size: 14px;
  opacity: 0.8;
  margin: 0 0 30px 0;
  text-align: center;
`;

const ApprovalCard = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  width: 100%;
  animation: ${fadeIn} 0.5s ease-out;
`;

const ApprovalTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ApprovalMessage = styled.p`
  font-size: 14px;
  line-height: 1.4;
  margin: 0 0 16px 0;
  opacity: 0.9;
`;

const RequestDetails = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  opacity: 0.7;
`;

const DetailValue = styled.span`
  font-weight: 500;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const ActionButton = styled.button<{ $variant: 'approve' | 'deny' }>`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: ${(props) =>
		props.$variant === 'approve'
			? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
			: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 28px;
  animation: ${fadeIn} 0.3s ease-out;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SuccessMessage = styled.div`
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out;
`;

const SuccessIcon = styled.div`
  font-size: 60px;
  margin-bottom: 16px;
`;

const SuccessText = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const SuccessSubtext = styled.p`
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
`;

interface CIBAUserApprovalModalProps {
	isOpen: boolean;
	onClose: () => void;
	onApprove: () => void;
	onDeny: () => void;
	authReqId?: string;
	bindingMessage?: string;
	requestContext?: string;
	clientName?: string;
	scope?: string;
}

export const CIBAUserApprovalModal: React.FC<CIBAUserApprovalModalProps> = ({
	isOpen,
	onClose,
	onApprove,
	onDeny,
	authReqId,
	bindingMessage = 'Please approve this authentication request',
	requestContext,
	clientName = 'OAuth Playground Client',
	scope = 'openid profile email',
}) => {
	const [approvalState, setApprovalState] = useState<'pending' | 'loading' | 'approved' | 'denied'>(
		'pending'
	);
	const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default

	useEffect(() => {
		if (isOpen && approvalState === 'pending') {
			const timer = setInterval(() => {
				setTimeLeft((prev) => {
					if (prev <= 1) {
						setApprovalState('denied');
						return 0;
					}
					return prev - 1;
				});
			}, 1000);

			return () => clearInterval(timer);
		}
		return undefined;
	}, [isOpen, approvalState]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const handleApprove = () => {
		setApprovalState('loading');

		// Simulate processing time
		setTimeout(() => {
			setApprovalState('approved');
			onApprove();

			// Auto-close after success
			setTimeout(() => {
				onClose();
			}, 2000);
		}, 1500);
	};

	const handleDeny = () => {
		setApprovalState('loading');

		setTimeout(() => {
			setApprovalState('denied');
			onDeny();

			// Auto-close after denial
			setTimeout(() => {
				onClose();
			}, 1500);
		}, 1000);
	};

	const resetModal = () => {
		setApprovalState('pending');
		setTimeLeft(300);
	};

	const handleClose = () => {
		resetModal();
		onClose();
	};

	if (!isOpen) return null;

	return (
		<DraggableModal
			isOpen={isOpen}
			onClose={handleClose}
			title="📱 CIBA User Approval Simulation"
			width="400px"
			maxHeight="700px"
		>
			<PhoneContainer>
				<PhoneScreen>
					<StatusBar>
						<span>{formatTime(timeLeft)}</span>
						<span>🔒 PingOne Secure</span>
					</StatusBar>

					<AppContent>
						<AppLogo>🔐</AppLogo>
						<AppTitle>PingOne</AppTitle>
						<AppSubtitle>Authentication Request</AppSubtitle>

						{approvalState === 'pending' && (
							<ApprovalCard>
								<ApprovalTitle>
									<span>📱</span>
									Authentication Request
								</ApprovalTitle>

								<ApprovalMessage>{bindingMessage}</ApprovalMessage>

								{requestContext && (
									<RequestDetails>
										<DetailRow>
											<DetailLabel>Context:</DetailLabel>
											<DetailValue>{requestContext}</DetailValue>
										</DetailRow>
									</RequestDetails>
								)}

								<RequestDetails>
									<DetailRow>
										<DetailLabel>Client:</DetailLabel>
										<DetailValue>{clientName}</DetailValue>
									</DetailRow>
									<DetailRow>
										<DetailLabel>Permissions:</DetailLabel>
										<DetailValue>{scope}</DetailValue>
									</DetailRow>
									{authReqId && (
										<DetailRow>
											<DetailLabel>Request ID:</DetailLabel>
											<DetailValue>{authReqId.substring(0, 8)}...</DetailValue>
										</DetailRow>
									)}
								</RequestDetails>

								<ActionButtons>
									<ActionButton $variant="deny" onClick={handleDeny}>
										❌ Deny
									</ActionButton>
									<ActionButton $variant="approve" onClick={handleApprove}>
										✅ Approve
									</ActionButton>
								</ActionButtons>
							</ApprovalCard>
						)}

						{approvalState === 'loading' && (
							<LoadingOverlay>
								<div>
									<LoadingSpinner />
									<div style={{ color: 'white', marginTop: 16, textAlign: 'center' }}>
										Processing...
									</div>
								</div>
							</LoadingOverlay>
						)}

						{approvalState === 'approved' && (
							<SuccessMessage>
								<SuccessIcon>✅</SuccessIcon>
								<SuccessText>Request Approved!</SuccessText>
								<SuccessSubtext>Authentication successful</SuccessSubtext>
							</SuccessMessage>
						)}

						{approvalState === 'denied' && (
							<SuccessMessage>
								<SuccessIcon>❌</SuccessIcon>
								<SuccessText>Request Denied</SuccessText>
								<SuccessSubtext>Authentication cancelled</SuccessSubtext>
							</SuccessMessage>
						)}
					</AppContent>
				</PhoneScreen>
			</PhoneContainer>
		</DraggableModal>
	);
};
