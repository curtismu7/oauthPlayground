// src/services/authenticationModalService.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiShield, FiExternalLink, FiX, FiInfo, FiCheckCircle, FiClock } from 'react-icons/fi';
import { ColoredUrlDisplay } from '../components/ColoredUrlDisplay';
import { v4ToastManager } from '../utils/v4ToastMessages';

// Modern styled components with professional design
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(8px);
	display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 10000;
	padding: 1rem;
	animation: ${({ $isOpen }) => ($isOpen ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.2s ease-in')};

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(0.95);
		}
	}
`;

const ModalContainer = styled.div`
	background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
	border-radius: 1rem;
	box-shadow: 
		0 25px 50px -12px rgba(0, 0, 0, 0.25),
		0 0 0 1px rgba(255, 255, 255, 0.05);
	max-width: 700px;
	width: 100%;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	position: relative;
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 2rem 2rem 1rem 2rem;
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border-bottom: 1px solid #e2e8f0;
`;

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`;

const HeaderIcon = styled.div`
	width: 3rem;
	height: 3rem;
	border-radius: 50%;
	background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
`;

const HeaderText = styled.div`
	flex: 1;
`;

const ModalTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 700;
	color: #1e293b;
	margin: 0;
	line-height: 1.2;
`;

const ModalSubtitle = styled.p`
	font-size: 0.875rem;
	color: #64748b;
	margin: 0.25rem 0 0 0;
	font-weight: 500;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	color: #64748b;
	cursor: pointer;
	padding: 0.5rem;
	border-radius: 0.5rem;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #1e293b;
	}
`;

const ModalContent = styled.div`
	padding: 2rem;
	overflow-y: auto;
	flex: 1;
`;

const DescriptionSection = styled.div`
	margin-bottom: 2rem;
`;

const DescriptionText = styled.p`
	font-size: 1rem;
	color: #475569;
	line-height: 1.6;
	margin: 0;
`;

const SecurityNotice = styled.div`
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	border: 1px solid #f59e0b;
	border-radius: 0.75rem;
	padding: 1rem;
	margin: 1rem 0 2rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`;

const SecurityIcon = styled.div`
	color: #d97706;
	margin-top: 0.125rem;
`;

const SecurityText = styled.div`
	color: #92400e;
	font-size: 0.875rem;
	line-height: 1.5;

	strong {
		font-weight: 600;
	}
`;

const UrlSection = styled.div`
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
`;

const UrlHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1rem;
`;

const UrlTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #374151;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const UrlSubtitle = styled.p`
	font-size: 0.75rem;
	color: #6b7280;
	margin: 0.25rem 0 0 0;
	font-weight: 500;
`;

const FlowInfo = styled.div`
	background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
	border: 1px solid #10b981;
	border-radius: 0.75rem;
	padding: 1rem;
	margin-bottom: 2rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const FlowIcon = styled.div`
	color: #059669;
`;

const FlowText = styled.div`
	color: #065f46;
	font-size: 0.875rem;
	line-height: 1.5;

	strong {
		font-weight: 600;
	}
`;


const ModalActions = styled.div`
	display: flex;
	gap: 1rem;
	justify-content: flex-end;
	align-items: center;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	min-width: 120px;
	justify-content: center;

	${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
					color: white;
					box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

					&:hover:not(:disabled) {
						background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
						box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
						transform: translateY(-1px);
					}
				`;
			case 'secondary':
				return `
					background: white;
					color: #374151;
					border: 1px solid #d1d5db;

					&:hover:not(:disabled) {
						background: #f9fafb;
						border-color: #9ca3af;
					}
				`;
			case 'danger':
				return `
					background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
					color: white;
					box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

					&:hover:not(:disabled) {
						background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
						box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
						transform: translateY(-1px);
					}
				`;
			default:
				return '';
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none !important;
		box-shadow: none !important;
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}
`;

// Props interface
interface AuthenticationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onContinue: () => void;
	authUrl: string;
	flowType: 'oauth' | 'oidc' | 'par' | 'rar' | 'redirectless';
	flowName: string;
	description?: string;
	redirectMode?: 'popup' | 'redirect';
}

// Main component
export const AuthenticationModal: React.FC<AuthenticationModalProps> = ({
	isOpen,
	onClose,
	onContinue,
	authUrl,
	flowType,
	flowName,
	description,
	redirectMode = 'popup',
}) => {
	// Auto-redirect countdown timer (20 seconds)
	const [countdown, setCountdown] = React.useState<number>(20);
	const countdownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

	// Validate URL to prevent ColoredUrlDisplay errors
	const isValidUrl = (url: string): boolean => {
		try {
			new URL(url);
			return url.trim().length > 0;
		} catch {
			return false;
		}
	};

	const safeAuthUrl = isValidUrl(authUrl) ? authUrl : 'https://auth.pingone.com/placeholder/as/authorize?client_id=placeholder&redirect_uri=placeholder&response_type=code&scope=openid';

	const handleContinue = React.useCallback(() => {
		console.log('🚀 [AuthModal] handleContinue called');
		
		// Clear any running countdown
		if (countdownIntervalRef.current) {
			clearInterval(countdownIntervalRef.current);
			countdownIntervalRef.current = null;
		}
		
		// Validate URL before proceeding
		if (!isValidUrl(authUrl)) {
			v4ToastManager.showError('Invalid authorization URL. Please generate the authorization URL first.');
			return;
		}
		
		try {
			if (redirectMode === 'popup') {
				// Open in a centered popup window
				const width = 600;
				const height = 700;
				const left = window.screen.width / 2 - width / 2;
				const top = window.screen.height / 2 - height / 2;
				
				console.log('🔧 [AuthModal] Opening popup window...');
				console.log('🔧 [AuthModal] Auth URL:', authUrl);
				console.log('🔧 [AuthModal] Popup name: PingOneAuth');
				
				const popup = window.open(
					authUrl,
					'PingOneAuth',
					`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
				);
				
				if (popup) {
					console.log('✅ [AuthModal] Popup opened successfully');
					console.log('✅ [AuthModal] Popup reference:', popup);
					console.log('✅ [AuthModal] Popup closed?', popup.closed);
					
					// Monitor popup to detect if it closes unexpectedly
					const monitorPopup = setInterval(() => {
						if (popup.closed) {
							console.log('❌ [AuthModal] Popup was closed!');
							clearInterval(monitorPopup);
						} else {
							console.log('✅ [AuthModal] Popup still open...');
						}
					}, 1000);
					
					// Stop monitoring after 30 seconds
					setTimeout(() => {
						clearInterval(monitorPopup);
						console.log('🔌 [AuthModal] Stopped monitoring popup');
					}, 30000);
					
					v4ToastManager.showSuccess('Authentication popup opened successfully!');
					
					// Close modal immediately
					onClose();
					
					// Call the onContinue callback if provided (but popup should stay open!)
					console.log('🔧 [AuthModal] Calling onContinue callback...');
					onContinue?.();
					console.log('🔧 [AuthModal] onContinue callback completed');
					console.log('🔧 [AuthModal] Popup still open after callback?', !popup.closed);
				} else {
					console.error('❌ [AuthModal] Popup blocked by browser');
					v4ToastManager.showError('Popup blocked! Please allow popups for this site.');
				}
			} else {
				// Redirect current tab
				console.log('🔧 [AuthModal] Redirecting to:', authUrl);
				window.location.href = authUrl;
			}
		} catch (error) {
			console.error('❌ [AuthModal] Failed to open authentication:', error);
			v4ToastManager.showError('Failed to open authentication. Please try again.');
		}
		
		// Close modal after redirect
		if (redirectMode !== 'popup') {
			onClose();
		}
	}, [authUrl, redirectMode, onContinue, onClose]);

	const handleCancel = () => {
		// Clear countdown when canceling
		if (countdownIntervalRef.current) {
			clearInterval(countdownIntervalRef.current);
			countdownIntervalRef.current = null;
		}
		onClose();
	};

	// Auto-redirect countdown effect
	React.useEffect(() => {
		console.log('⏰ [AuthModal] Countdown effect triggered', { isOpen, isValidUrl: isValidUrl(authUrl), countdown });
		
		if (!isOpen || !isValidUrl(authUrl)) {
			// Reset countdown when modal closes or URL is invalid
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current);
				countdownIntervalRef.current = null;
			}
			setCountdown(20);
			return;
		}

		// Start countdown when modal opens
		console.log('⏰ [AuthModal] Starting 20-second countdown...');
		countdownIntervalRef.current = setInterval(() => {
			setCountdown((prev) => {
				console.log(`⏰ [AuthModal] Countdown: ${prev}`);
				if (prev <= 1) {
					// Countdown finished - trigger redirect
					console.log('⏰ [AuthModal] Countdown complete - triggering redirect');
					if (countdownIntervalRef.current) {
						clearInterval(countdownIntervalRef.current);
						countdownIntervalRef.current = null;
					}
					handleContinue();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => {
			console.log('⏰ [AuthModal] Cleaning up countdown effect');
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current);
				countdownIntervalRef.current = null;
			}
		};
	}, [isOpen, authUrl, handleContinue]);

	// Get flow-specific information
	const getFlowInfo = () => {
		switch (flowType) {
			case 'oauth':
				return {
					title: 'OAuth 2.0 Authorization',
					description: 'Standard OAuth 2.0 authorization flow with PKCE',
					icon: <FiShield />,
				};
			case 'oidc':
				return {
					title: 'OpenID Connect Authentication',
					description: 'OpenID Connect authentication with identity verification',
					icon: <FiCheckCircle />,
				};
			case 'par':
				return {
					title: 'Pushed Authorization Request',
					description: 'Enhanced security with pushed authorization parameters',
					icon: <FiExternalLink />,
				};
			case 'rar':
				return {
					title: 'Rich Authorization Request',
					description: 'Fine-grained authorization with structured permissions',
					icon: <FiInfo />,
				};
			case 'redirectless':
				return {
					title: 'Redirectless Authentication',
					description: 'API-driven authentication without browser redirects',
					icon: <FiClock />,
				};
			default:
				return {
					title: 'Authentication',
					description: 'Secure authentication flow',
					icon: <FiShield />,
				};
		}
	};

	const flowInfo = getFlowInfo();

	return (
		<ModalOverlay $isOpen={isOpen}>
			<ModalContainer>
				<ModalHeader>
					<HeaderContent>
						<HeaderIcon>
							{flowInfo.icon}
						</HeaderIcon>
						<HeaderText>
							<ModalTitle>Ready to Authenticate?</ModalTitle>
							<ModalSubtitle>{flowInfo.title}</ModalSubtitle>
						</HeaderText>
					</HeaderContent>
					<CloseButton onClick={handleCancel} title="Cancel authentication">
						<FiX size={20} />
					</CloseButton>
				</ModalHeader>

				<ModalContent>
					<DescriptionSection>
						<DescriptionText>
							{description || `You're about to be redirected to PingOne for authentication. This will open in a ${redirectMode === 'popup' ? 'new popup window' : 'redirect your current tab'}.`}
						</DescriptionText>
					</DescriptionSection>

					<FlowInfo>
						<FlowIcon>
							<FiInfo size={16} />
						</FlowIcon>
						<FlowText>
							<strong>Flow Type:</strong> {flowName} - {flowInfo.description}
						</FlowText>
					</FlowInfo>


					<SecurityNotice>
						<SecurityIcon>
							<FiShield size={16} />
						</SecurityIcon>
						<SecurityText>
							<strong>Security Notice:</strong> This authentication is handled securely through PingOne's authorization server. Your credentials are never shared with this application.
						</SecurityText>
					</SecurityNotice>

					<UrlSection>
						<UrlHeader>
							<div>
								<UrlTitle>
									<FiExternalLink size={16} />
									Authorization URL
								</UrlTitle>
								<UrlSubtitle>
									{isValidUrl(authUrl) 
										? 'Generated authorization URL ready for authentication'
										: 'Please generate the authorization URL first'
									}
								</UrlSubtitle>
							</div>
						</UrlHeader>
						{!isValidUrl(authUrl) && (
							<div style={{
								background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
								border: '1px solid #f59e0b',
								borderRadius: '0.5rem',
								padding: '1rem',
								marginBottom: '1rem',
								display: 'flex',
								alignItems: 'center',
								gap: '0.75rem'
							}}>
								<div style={{ color: '#d97706' }}>
									<FiInfo size={16} />
								</div>
								<div style={{ color: '#92400e', fontSize: '0.875rem', lineHeight: '1.5' }}>
									<strong>Authorization URL Required:</strong> Please complete the previous steps to generate the authorization URL before proceeding with authentication.
								</div>
							</div>
						)}
						<ColoredUrlDisplay
							url={safeAuthUrl}
							title="Authorization URL"
							showExplainButton={isValidUrl(authUrl)}
							showCopyButton={isValidUrl(authUrl)}
							showOpenButton={false}
						/>
					</UrlSection>

					{/* Auto-redirect countdown */}
					{isValidUrl(authUrl) && (
						<div style={{
							padding: '1rem',
							background: '#eff6ff',
							border: '1px solid #bfdbfe',
							borderRadius: '8px',
							marginTop: '1rem',
							textAlign: 'center',
							color: '#1e40af',
							fontSize: '0.875rem',
							fontWeight: '500'
						}}>
							<FiClock size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
							Auto-redirecting in {countdown} seconds...
						</div>
					)}

					<ModalActions>
					<ActionButton 
						type="button"
						$variant="secondary" 
						onClick={handleCancel}
					>
						Cancel
					</ActionButton>
					<ActionButton 
						type="button"
						$variant="primary" 
						onClick={handleContinue}
						disabled={!isValidUrl(authUrl)}
					>
						<FiExternalLink size={16} />
						Continue Now
					</ActionButton>
					</ModalActions>
				</ModalContent>
			</ModalContainer>
		</ModalOverlay>
	);
};

// Service class for easy integration
export class AuthenticationModalService {
	/**
	 * Show authentication modal with flow-specific configuration
	 */
	static showModal(
		isOpen: boolean,
		onClose: () => void,
		onContinue: () => void,
		authUrl: string,
		flowType: 'oauth' | 'oidc' | 'par' | 'rar' | 'redirectless',
		flowName: string,
		options?: {
			description?: string;
			redirectMode?: 'popup' | 'redirect';
		}
	) {
		return (
			<AuthenticationModal
				isOpen={isOpen}
				onClose={onClose}
				onContinue={onContinue}
				authUrl={authUrl}
				flowType={flowType}
				flowName={flowName}
				description={options?.description}
				redirectMode={options?.redirectMode}
			/>
		);
	}

	/**
	 * Get flow-specific configuration
	 */
	static getFlowConfig(flowType: 'oauth' | 'oidc' | 'par' | 'rar' | 'redirectless') {
		const configs = {
			oauth: {
				name: 'OAuth 2.0 Authorization Code',
				description: 'Standard OAuth 2.0 authorization flow with PKCE security',
				redirectMode: 'popup' as const,
			},
			oidc: {
				name: 'OpenID Connect Authorization Code',
				description: 'OpenID Connect authentication with identity verification',
				redirectMode: 'popup' as const,
			},
			par: {
				name: 'PingOne PAR Flow',
				description: 'Enhanced security with pushed authorization parameters',
				redirectMode: 'popup' as const,
			},
			rar: {
				name: 'Rich Authorization Request',
				description: 'Fine-grained authorization with structured permissions',
				redirectMode: 'popup' as const,
			},
			redirectless: {
				name: 'Redirectless Authentication',
				description: 'API-driven authentication without browser redirects',
				redirectMode: 'redirect' as const,
			},
		};

		return configs[flowType];
	}
}

export default AuthenticationModalService;
