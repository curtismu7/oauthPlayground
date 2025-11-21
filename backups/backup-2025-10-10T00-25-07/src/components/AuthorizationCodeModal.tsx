// src/components/AuthorizationCodeModal.tsx
import React, { useEffect, useState } from 'react';
import { FiCheck, FiCopy, FiExternalLink, FiX } from 'react-icons/fi';
import styled, { keyframes } from 'styled-components';

// Animation for success checkmark
const checkmarkAnimation = keyframes`
	0% {
		transform: scale(0);
		opacity: 0;
	}
	50% {
		transform: scale(1.2);
		opacity: 1;
	}
	100% {
		transform: scale(1);
		opacity: 1;
	}
`;

const pulseAnimation = keyframes`
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.05);
	}
`;

const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	max-width: 600px;
	width: 90%;
	max-height: 85vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

const ModalHeader = styled.div`
	background: linear-gradient(135deg, #10b981, #059669);
	color: white;
	padding: 1.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const ModalTitle = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 700;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CloseButton = styled.button`
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	padding: 0.5rem;
	border-radius: 0.5rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.3);
	}
`;

const ModalContent = styled.div`
	flex: 1;
	overflow-y: auto;
	min-height: 0;
	padding: 2rem;
`;

const SuccessSection = styled.div`
	text-align: center;
	margin-bottom: 2rem;
`;

const SuccessIcon = styled.div`
	width: 80px;
	height: 80px;
	background: linear-gradient(135deg, #10b981, #059669);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1rem;
	animation: ${checkmarkAnimation} 0.6s ease-out;
`;

const SuccessTitle = styled.h3`
	color: #10b981;
	font-size: 1.5rem;
	font-weight: 700;
	margin: 0 0 0.5rem;
`;

const SuccessMessage = styled.p`
	color: #6b7280;
	font-size: 1rem;
	margin: 0;
	line-height: 1.6;
`;

const AuthorizationCodeSection = styled.div`
	background: #f8fafc;
	border: 2px solid #e2e8f0;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
`;

const SectionLabel = styled.label`
	display: block;
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.75rem;
`;

const CodeContainer = styled.div`
	background: white;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	padding: 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	word-break: break-all;
	position: relative;
	animation: ${pulseAnimation} 2s infinite;
`;

const CopyButton = styled.button<{ $copied: boolean }>`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	background: ${({ $copied }) => ($copied ? '#10b981' : '#3b82f6')};
	color: white;
	border: none;
	padding: 0.5rem;
	border-radius: 0.375rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	transition: all 0.2s ease;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

	&:hover {
		background: ${({ $copied }) => ($copied ? '#059669' : '#2563eb')};
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}
`;

const InfoSection = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.75rem;
	padding: 1.25rem;
	margin-bottom: 2rem;
`;

const InfoTitle = styled.h4`
	color: #1e40af;
	font-size: 1rem;
	font-weight: 600;
	margin: 0 0 0.75rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const InfoText = styled.p`
	color: #1e40af;
	font-size: 0.875rem;
	margin: 0;
	line-height: 1.6;
`;

const ModalActions = styled.div`
	flex-shrink: 0;
	padding: 1.5rem 2rem;
	background: #f9fafb;
	border-top: 1px solid #e5e7eb;
	display: flex;
	justify-content: center;
`;

const ContinueButton = styled.button`
	background: linear-gradient(135deg, #3b82f6, #2563eb);
	color: white;
	border: none;
	padding: 1rem 2rem;
	border-radius: 0.75rem;
	font-size: 1rem;
	font-weight: 700;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.3s ease;
	box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);

	&:hover {
		background: linear-gradient(135deg, #2563eb, #1d4ed8);
		transform: translateY(-2px);
		box-shadow: 0 8px 12px -2px rgba(59, 130, 246, 0.4);
	}

	&:active {
		transform: translateY(0);
	}
`;

interface AuthorizationCodeModalProps {
	isOpen: boolean;
	onClose: () => void;
	authorizationCode: string;
	onContinue: () => void;
}

export const AuthorizationCodeModal: React.FC<AuthorizationCodeModalProps> = ({
	isOpen,
	onClose,
	authorizationCode,
	onContinue,
}) => {
	const [copied, setCopied] = useState(false);

	// Debug modal state changes
	useEffect(() => {
		console.log('🔍 [AuthCodeModal] ===== MODAL STATE CHANGED =====');
		console.log('🔍 [AuthCodeModal] Modal props:', {
			isOpen,
			authorizationCode: authorizationCode ? `${authorizationCode.substring(0, 10)}...` : 'none',
			hasOnClose: !!onClose,
			hasOnContinue: !!onContinue,
			timestamp: new Date().toISOString(),
		});
	}, [isOpen, authorizationCode, onClose, onContinue]);

	const handleCopy = async () => {
		console.log('🔍 [AuthCodeModal] Copy button clicked');
		try {
			await navigator.clipboard.writeText(authorizationCode);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			console.log('🔍 [AuthCodeModal] Authorization code copied to clipboard');
		} catch (err) {
			console.error('🔍 [AuthCodeModal] Failed to copy authorization code:', err);
		}
	};

	const handleContinue = () => {
		console.log('🔍 [AuthCodeModal] Continue button clicked');
		onContinue();
		onClose();
	};

	if (!isOpen) return null;

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContainer onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<ModalTitle>
						<FiExternalLink />
						Authorization Successful
					</ModalTitle>
					<CloseButton onClick={onClose}>
						<FiX size={20} />
					</CloseButton>
				</ModalHeader>

				<ModalContent>
					<SuccessSection>
						<SuccessIcon>
							<FiCheck size={40} />
						</SuccessIcon>
						<SuccessTitle>Welcome Back from PingOne!</SuccessTitle>
						<SuccessMessage>
							Your authorization was successful. PingOne has returned an authorization code that you
							can now use to exchange for access tokens.
						</SuccessMessage>
					</SuccessSection>

					<AuthorizationCodeSection>
						<SectionLabel>Authorization Code</SectionLabel>
						<CodeContainer>
							{authorizationCode}
							<CopyButton onClick={handleCopy} $copied={copied}>
								{copied ? (
									<>
										<FiCheck size={14} />
										Copied!
									</>
								) : (
									<>
										<FiCopy size={14} />
										Copy
									</>
								)}
							</CopyButton>
						</CodeContainer>
					</AuthorizationCodeSection>

					<InfoSection>
						<InfoTitle>
							<FiExternalLink />
							Next Steps
						</InfoTitle>
						<InfoText>
							You can now proceed to exchange this authorization code for access tokens. The
							authorization code is typically short-lived (10 minutes), so it's recommended to
							exchange it for tokens as soon as possible.
						</InfoText>
					</InfoSection>
				</ModalContent>

				<ModalActions>
					<ContinueButton onClick={handleContinue}>
						<FiCheck />
						Continue to Token Exchange
					</ContinueButton>
				</ModalActions>
			</ModalContainer>
		</ModalOverlay>
	);
};

export default AuthorizationCodeModal;
