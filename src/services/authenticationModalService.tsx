// src/services/authenticationModalService.tsx
import React, { useState } from 'react';
import { FiCheckCircle, FiClock, FiExternalLink, FiInfo, FiShield, FiX } from '@icons';
import styled from 'styled-components';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import { ColoredUrlDisplay } from '../components/ColoredUrlDisplay';
import PARInputInterface from '../components/PARInputInterface';
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
	max-width: 900px;
	width: 100%;
	max-height: 95vh;
	display: flex;
	flex-direction: column;
	position: relative;
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.875rem 1.25rem;
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border-bottom: 1px solid #e2e8f0;
`;

const HeaderContent = styled.div`
	display: flex;
	align-items: center;
	gap: 0.625rem;
`;

const HeaderIcon = styled.div`
	width: 2.25rem;
	height: 2.25rem;
	border-radius: 50%;
	background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
	flex-shrink: 0;
	
	svg {
		width: 1.125rem;
		height: 1.125rem;
	}
`;

const HeaderText = styled.div`
	flex: 1;
	min-width: 0;
`;

const ModalTitle = styled.h2`
	font-size: 1.125rem;
	font-weight: 700;
	color: #1e293b;
	margin: 0;
	line-height: 1.3;
`;

const ModalSubtitle = styled.p`
	font-size: 0.75rem;
	color: #64748b;
	margin: 0.125rem 0 0 0;
	font-weight: 500;
	line-height: 1.3;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	color: #64748b;
	cursor: pointer;
	padding: 0.375rem;
	border-radius: 0.375rem;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;

	&:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #1e293b;
	}
	
	svg {
		width: 1.125rem;
		height: 1.125rem;
	}
`;

const ModalContent = styled.div`
	padding: 1rem 1.25rem;
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
`;

const ScrollableContent = styled.div`
	overflow-y: auto;
	flex: 1;
	padding-right: 0.375rem;
	margin-right: -0.375rem;
`;

const DescriptionSection = styled.div`
	margin-bottom: 0.75rem;
`;

const DescriptionText = styled.p`
	font-size: 0.875rem;
	color: #475569;
	line-height: 1.5;
	margin: 0;
`;

const SecurityNotice = styled.div`
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	border: 1px solid #f59e0b;
	border-radius: 0.5rem;
	padding: 0.625rem 0.75rem;
	margin: 0.5rem 0 0.75rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
`;

const SecurityIcon = styled.div`
	color: #d97706;
	margin-top: 0.0625rem;
	flex-shrink: 0;
	
	svg {
		width: 0.875rem;
		height: 0.875rem;
	}
`;

const SecurityText = styled.div`
	color: #92400e;
	font-size: 0.8125rem;
	line-height: 1.4;

	strong {
		font-weight: 600;
	}
`;

const UrlSection = styled.div`
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 0.875rem 1rem;
	margin-bottom: 0.75rem;
`;

const UrlHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.625rem;
`;

const UrlTitle = styled.h3`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.375rem;
	
	svg {
		width: 0.875rem;
		height: 0.875rem;
	}
`;

const UrlSubtitle = styled.p`
	font-size: 0.6875rem;
	color: #6b7280;
	margin: 0.125rem 0 0 0;
	font-weight: 500;
	line-height: 1.3;
`;

const FlowInfo = styled.div`
	background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
	border: 1px solid #10b981;
	border-radius: 0.5rem;
	padding: 0.625rem 0.75rem;
	margin-bottom: 0.75rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const FlowIcon = styled.div`
	color: #059669;
	flex-shrink: 0;
	
	svg {
		width: 0.875rem;
		height: 0.875rem;
	}
`;

const FlowText = styled.div`
	color: #065f46;
	font-size: 0.8125rem;
	line-height: 1.4;

	strong {
		font-weight: 600;
	}
`;

const ModalActions = styled.div`
	display: flex;
	gap: 0.625rem;
	justify-content: flex-end;
	align-items: center;
	margin-top: auto;
	padding-top: 0.875rem;
	border-top: 1px solid #e2e8f0;
	background: #ffffff;
	position: sticky;
	bottom: 0;
	z-index: 10;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.5rem 1rem;
	border-radius: 0.375rem;
	font-size: 0.8125rem;
	font-weight: 600;
	border: none;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.375rem;
	min-width: 100px;
	justify-content: center;
	
	svg {
		width: 0.875rem;
		height: 0.875rem;
	}

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
	description?: string | undefined;
	redirectMode?: 'popup' | 'redirect';
	onUrlChange?: (editedUrl: string) => void; // Callback when URL is edited
	editable?: boolean; // Whether the URL should be editable
}

// Editable URL Textarea styled component - sized to fit full URI without scrolling
const EditableUrlTextarea = styled.textarea<{ $lineCount?: number }>`
	width: 100%;
	height: ${({ $lineCount = 4 }) => `${Math.max($lineCount * 1.7 + 1, 6)}rem`};
	min-height: 6rem;
	max-height: 20rem;
	padding: 0.625rem 0.75rem;
	border: 1px solid #cbd5e1;
	border-radius: 0.375rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.8125rem;
	line-height: 1.7;
	color: #1e293b;
	background: #ffffff;
	resize: none; /* Disable resize to prevent scrolling */
	overflow-y: auto; /* Only show scrollbar if content truly exceeds max-height */
	transition: border-color 0.2s ease, box-shadow 0.2s ease;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}
	
	&::placeholder {
		color: #94a3b8;
	}
`;

// Container for colored URL display
const ColoredUrlContainer = styled.div`
	margin-bottom: 0.625rem;
	border-radius: 0.375rem;
	overflow: hidden;
`;

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
	onUrlChange,
	editable = true, // Default to editable
}) => {
	// Countdown timer ref (not currently used for auto-redirect, but kept for future use)
	const countdownIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

	// PAR input modal state
	const [showPARInput, setShowPARInput] = useState(false);
	const [parGeneratedUrl, setParGeneratedUrl] = useState<string>('');

	// Editable URL state
	const [editedUrl, setEditedUrl] = useState<string>(authUrl);

	// Update editedUrl when authUrl prop changes
	React.useEffect(() => {
		setEditedUrl(authUrl);
	}, [authUrl]);

	// Calculate line count for URL to size textarea appropriately
	const calculateLineCount = (url: string): number => {
		if (!url) return 4;
		// Approximate line breaks: count characters and divide by estimated chars per line
		// Monospace font at 0.8125rem ≈ 10-12 chars per line at typical modal width
		const charsPerLine = 85; // Conservative estimate for modal width
		const lineCount = Math.ceil(url.length / charsPerLine);
		return Math.max(lineCount, 4); // Minimum 4 lines
	};

	const urlLineCount = React.useMemo(
		() => calculateLineCount(editedUrl || authUrl),
		[editedUrl, authUrl, calculateLineCount]
	);

	// Validate URL to prevent ColoredUrlDisplay errors
	const isValidUrl = (url: string): boolean => {
		try {
			new URL(url);
			return url.trim().length > 0;
		} catch {
			return false;
		}
	};

	// Handle PAR data submission
	const handlePARDataSubmit = (parData: { requestUri: string }) => {
		try {
			// Parse the existing authorization URL to preserve all parameters
			const existingUrl = new URL(authUrl);
			const existingParams = new URLSearchParams(existingUrl.search);

			// Add the request_uri parameter to the existing parameters
			existingParams.set('request_uri', parData.requestUri);

			// Generate the new URL with all original parameters plus request_uri
			const generatedUrl = `${existingUrl.origin}${existingUrl.pathname}?${existingParams.toString()}`;
			setParGeneratedUrl(generatedUrl);
			setShowPARInput(false);

			v4ToastManager.showSuccess('PAR Authorization URL Generated', {
				description: 'Authorization URL with PAR request_uri has been generated successfully.',
			});
		} catch (error) {
			console.error('Error generating PAR URL:', error);
			v4ToastManager.showError('Failed to Generate PAR URL', {
				description: 'There was an error generating the authorization URL with PAR data.',
			});
		}
	};

	// Use edited URL if available, otherwise PAR-generated URL, otherwise the provided authUrl
	const displayUrl = editedUrl || parGeneratedUrl || authUrl;
	const safeAuthUrl = isValidUrl(displayUrl)
		? displayUrl
		: 'https://auth.pingone.com/placeholder/as/authorize?client_id=placeholder&redirect_uri=placeholder&response_type=code&scope=openid';

	// Handle URL editing
	const handleUrlChange = (newUrl: string) => {
		setEditedUrl(newUrl);
		onUrlChange?.(newUrl);
	};

	const handleContinue = React.useCallback(() => {
		console.log('🚀 [AuthModal] handleContinue called');

		// Clear any running countdown
		if (countdownIntervalRef.current) {
			clearInterval(countdownIntervalRef.current);
			countdownIntervalRef.current = null;
		}

		// Use edited URL if available, otherwise fallback to authUrl
		const urlToUse = editedUrl || authUrl;

		// Validate URL before proceeding
		if (!isValidUrl(urlToUse)) {
			v4ToastManager.showError('Invalid authorization URL. Please check the URL and try again.');
			return;
		}

		// Notify parent of URL change if edited
		if (editedUrl && editedUrl !== authUrl) {
			onUrlChange?.(editedUrl);
		}

		try {
			if (redirectMode === 'popup') {
				// Open in a centered popup window
				const width = 600;
				const height = 700;
				const left = window.screen.width / 2 - width / 2;
				const top = window.screen.height / 2 - height / 2;

				console.log('🔧 [AuthModal] Opening popup window...');
				console.log('🔧 [AuthModal] Auth URL:', urlToUse);
				console.log('🔧 [AuthModal] Popup name: PingOneAuth');

				const popup = window.open(
					urlToUse,
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
						}
						// Removed excessive logging to avoid performance issues
					}, 2000); // Reduced frequency to every 2 seconds

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
				console.log('🔧 [AuthModal] Redirecting to:', urlToUse);
				window.location.href = urlToUse;
			}
		} catch (error) {
			console.error('❌ [AuthModal] Failed to open authentication:', error);
			v4ToastManager.showError('Failed to open authentication. Please try again.');
		}

		// Close modal after redirect
		if (redirectMode !== 'popup') {
			onClose();
		}
	}, [editedUrl, authUrl, redirectMode, onContinue, onClose, onUrlChange, isValidUrl]);

	const handleCancel = () => {
		// Clear countdown when canceling
		if (countdownIntervalRef.current) {
			clearInterval(countdownIntervalRef.current);
			countdownIntervalRef.current = null;
		}
		onClose();
	};

	// Cleanup effect - clear intervals on unmount
	React.useEffect(() => {
		console.log('⏰ [AuthModal] Modal opened - waiting for user action (auto-redirect disabled)');

		if (!isOpen || !isValidUrl(authUrl)) {
			// Clear countdown when modal closes or URL is invalid
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current);
				countdownIntervalRef.current = null;
			}
			return;
		}

		// Auto-redirect disabled - user must click the button
		console.log('⏰ [AuthModal] Auto-redirect disabled - user must click Continue button');

		// Optional: Still show a countdown for reference, but don't auto-redirect
		// countdownIntervalRef.current = setInterval(() => {
		// 	setCountdown((prev) => {
		// 		console.log(`⏰ [AuthModal] Countdown: ${prev}`);
		// 		if (prev <= 1) {
		// 			// Countdown finished - trigger redirect
		// 			console.log('⏰ [AuthModal] Countdown complete - triggering redirect');
		// 			if (countdownIntervalRef.current) {
		// 				clearInterval(countdownIntervalRef.current);
		// 				countdownIntervalRef.current = null;
		// 			}
		// 			handleContinue();
		// 			return 0;
		// 		}
		// 		return prev - 1;
		// 	});
		// }, 1000);

		return () => {
			console.log('⏰ [AuthModal] Cleaning up countdown effect');
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current);
				countdownIntervalRef.current = null;
			}
		};
	}, [isOpen, authUrl, isValidUrl]);

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
		<>
			<ModalOverlay $isOpen={isOpen}>
				<ModalContainer>
					<ModalHeader>
						<HeaderContent>
							<HeaderIcon>{flowInfo.icon}</HeaderIcon>
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
						<ScrollableContent>
							<DescriptionSection>
								<DescriptionText>
									{description ||
										`You're about to be redirected to PingOne for authentication. This will open in a ${redirectMode === 'popup' ? 'new popup window' : 'redirect your current tab'}.`}
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
									<strong>Security Notice:</strong> This authentication is handled securely through
									PingOne's authorization server. Your credentials are never shared with this
									application.
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
												: 'Please generate the authorization URL first'}
										</UrlSubtitle>
									</div>
								</UrlHeader>
								{!isValidUrl(authUrl) && !editable && (
									<div
										style={{
											background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
											border: '1px solid #f59e0b',
											borderRadius: '0.375rem',
											padding: '0.625rem 0.75rem',
											marginBottom: '0.625rem',
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
										}}
									>
										<div style={{ color: '#d97706', flexShrink: 0 }}>
											<FiInfo size={14} />
										</div>
										<div style={{ color: '#92400e', fontSize: '0.8125rem', lineHeight: '1.4' }}>
											<strong>Authorization URL Required:</strong> Please complete the previous
											steps to generate the authorization URL before proceeding with authentication.
										</div>
									</div>
								)}
								{editable ? (
									<div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
										{/* Colored URL Display (read-only reference) */}
										{isValidUrl(editedUrl || authUrl) && (
											<ColoredUrlContainer>
												<ColoredUrlDisplay
													url={editedUrl || safeAuthUrl}
													label="Authorization URL (Reference)"
													showInfoButton={false}
													showCopyButton={false}
													showOpenButton={false}
													height="auto"
												/>
											</ColoredUrlContainer>
										)}

										{/* Editable Textarea */}
										<div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
												}}
											>
												<span style={{ fontSize: '0.6875rem', color: '#6b7280', fontWeight: 500 }}>
													Edit the URL below if needed:
												</span>
												<ButtonSpinner
													loading={false}
													onClick={() => {
														if (isValidUrl(editedUrl)) {
															navigator.clipboard.writeText(editedUrl);
															v4ToastManager.showSuccess('URL copied to clipboard!');
														}
													}}
													disabled={!isValidUrl(editedUrl)}
													spinnerSize={10}
													spinnerPosition="left"
													loadingText="Copying..."
													style={{
														padding: '0.25rem 0.5rem',
														fontSize: '0.6875rem',
														border: '1px solid #d1d5db',
														borderRadius: '0.25rem',
														background: isValidUrl(editedUrl) ? '#3b82f6' : '#e5e7eb',
														color: isValidUrl(editedUrl) ? 'white' : '#9ca3af',
														cursor: isValidUrl(editedUrl) ? 'pointer' : 'not-allowed',
														display: 'inline-flex',
														alignItems: 'center',
														gap: '0.25rem',
													}}
												>
													<FiExternalLink size={11} />
													Copy
												</ButtonSpinner>
											</div>
											<EditableUrlTextarea
												value={editedUrl}
												onChange={(e) => handleUrlChange(e.target.value)}
												placeholder="https://auth.pingone.com/{env-id}/as/authorize?response_type=code&client_id=..."
												spellCheck={false}
												$lineCount={urlLineCount}
											/>
											{editedUrl !== authUrl && (
												<span
													style={{ fontSize: '0.6875rem', color: '#f59e0b', fontStyle: 'italic' }}
												>
													URL has been edited
												</span>
											)}
										</div>
									</div>
								) : (
									<ColoredUrlDisplay
										url={safeAuthUrl}
										label="Authorization URL"
										showInfoButton={isValidUrl(authUrl)}
										showCopyButton={isValidUrl(authUrl)}
										showOpenButton={false}
									/>
								)}

								{/* PAR Input Option */}
								{flowType === 'oauth' && (
									<div
										style={{
											marginTop: '0.625rem',
											padding: '0.625rem 0.75rem',
											background: '#f8fafc',
											border: '1px solid #e2e8f0',
											borderRadius: '0.375rem',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											gap: '0.5rem',
										}}
									>
										<div style={{ flex: 1, minWidth: 0 }}>
											<div
												style={{
													fontSize: '0.8125rem',
													color: '#374151',
													fontWeight: 600,
													marginBottom: '0.125rem',
												}}
											>
												Using PAR?
											</div>
											<div style={{ fontSize: '0.6875rem', color: '#6b7280', lineHeight: '1.3' }}>
												Input a PAR request URI to generate the authorization URL
											</div>
										</div>
										<ButtonSpinner
											loading={false}
											onClick={() => {
												setShowPARInput(true);
											}}
											spinnerSize={10}
											spinnerPosition="left"
											loadingText="Opening..."
											style={{
												background: '#3b82f6',
												color: 'white',
												border: 'none',
												borderRadius: '0.375rem',
												padding: '0.375rem 0.75rem',
												fontSize: '0.75rem',
												fontWeight: 500,
												cursor: 'pointer',
												display: 'inline-flex',
												alignItems: 'center',
												gap: '0.375rem',
												flexShrink: 0,
											}}
										>
											<FiShield size={12} />
											Input PAR URI
										</ButtonSpinner>
									</div>
								)}
							</UrlSection>

							{/* User action required notice */}
							{isValidUrl(authUrl) && (
								<div
									style={{
										padding: '0.5rem 0.75rem',
										background: '#f0fdf4',
										border: '1px solid #86efac',
										borderRadius: '0.375rem',
										marginTop: '0.5rem',
										textAlign: 'center',
										color: '#15803d',
										fontSize: '0.75rem',
										fontWeight: '500',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '0.375rem',
									}}
								>
									<FiInfo size={12} />
									<span>Click "Continue Now" when you're ready to authenticate</span>
								</div>
							)}
						</ScrollableContent>

						<ModalActions>
							<ActionButton type="button" $variant="secondary" onClick={handleCancel}>
								Cancel
							</ActionButton>
							<ActionButton
								type="button"
								$variant="primary"
								onClick={handleContinue}
								disabled={!isValidUrl(editedUrl || authUrl)}
							>
								<FiExternalLink size={16} />
								Continue Now
							</ActionButton>
						</ModalActions>
					</ModalContent>
				</ModalContainer>
			</ModalOverlay>

			{/* PAR Input Modal */}
			<PARInputInterface
				isOpen={showPARInput}
				onClose={() => setShowPARInput(false)}
				onPARDataSubmit={handlePARDataSubmit}
			/>
		</>
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
			onUrlChange?: (editedUrl: string) => void;
			editable?: boolean;
		}
	) {
		const modalProps: AuthenticationModalProps = {
			isOpen,
			onClose,
			onContinue,
			authUrl,
			flowType,
			flowName,
			editable: options?.editable !== false,
		};

		// Conditionally add optional props only if they are defined
		if (options?.description !== undefined) {
			modalProps.description = options.description;
		}
		if (options?.redirectMode !== undefined) {
			modalProps.redirectMode = options.redirectMode;
		}
		if (options?.onUrlChange !== undefined) {
			modalProps.onUrlChange = options.onUrlChange;
		}

		return <AuthenticationModal {...modalProps} />;
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
