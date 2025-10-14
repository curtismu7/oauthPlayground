// src/components/RedirectModal.tsx
import React, { useEffect, useState } from 'react';
import { FiExternalLink, FiX, FiClock, FiCheck } from 'react-icons/fi';
import styled from 'styled-components';
import ColoredUrlDisplay from './ColoredUrlDisplay';

interface RedirectModalProps {
	isOpen: boolean;
	onClose: () => void;
	url: string;
	redirectDelay?: number; // in seconds
	title?: string;
	description?: string;
}

const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 1rem;
	backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
	background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
	border-radius: 20px;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	max-width: 500px;
	width: 100%;
	max-height: 75vh;
	border: 1px solid #e5e7eb;
	position: relative;
	display: flex;
	flex-direction: column;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
		border-radius: 20px 20px 0 0;
	}
`;

const ModalHeader = styled.div`
	padding: 1.5rem 1.5rem 0.75rem 1.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const ModalTitle = styled.h3`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 800;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.75rem;
	background: linear-gradient(135deg, #3b82f6, #8b5cf6);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	color: #6b7280;
	cursor: pointer;
	padding: 0.5rem;
	border-radius: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;

	&:hover {
		background: #f3f4f6;
		color: #374151;
	}
`;

const ModalContent = styled.div`
	padding: 0 1.5rem 0.75rem 1.5rem;
	flex: 1;
	overflow-y: auto;
	min-height: 0;
`;

const ModalDescription = styled.p`
	margin: 0 0 1.25rem 0;
	font-size: 1rem;
	color: #6b7280;
	line-height: 1.6;
`;

const URLSection = styled.div`
	margin-bottom: 1rem;
`;

const URLTitle = styled.h4`
	margin: 0 0 1rem 0;
	font-size: 1.125rem;
	font-weight: 700;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StatusSection = styled.div`
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
	border: 1px solid #86efac;
	border-radius: 12px;
	padding: 1rem;
	margin-bottom: 1rem;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(90deg, #10b981, #059669);
		border-radius: 12px 12px 0 0;
	}
`;

const StatusTitle = styled.h5`
	margin: 0 0 0.75rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: #065f46;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StatusText = styled.p`
	margin: 0;
	font-size: 0.875rem;
	color: #065f46;
	line-height: 1.5;
`;

const TimerSection = styled.div`
	background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
	border: 1px solid #60a5fa;
	border-radius: 12px;
	padding: 1rem;
	margin-bottom: 1rem;
	text-align: center;
`;

const TimerTitle = styled.h5`
	margin: 0 0 0.75rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: #1e40af;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
`;

const TimerDisplay = styled.div`
	font-size: 2rem;
	font-weight: 800;
	color: #1e40af;
	margin-bottom: 0.5rem;
`;

const TimerText = styled.p`
	margin: 0;
	font-size: 0.875rem;
	color: #1e40af;
`;

const ModalActions = styled.div`
	display: flex;
	gap: 1rem;
	justify-content: center;
	padding: 1rem 1.5rem 1.5rem 1.5rem;
	background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
	border-top: 1px solid #e5e7eb;
	border-radius: 0 0 20px 20px;
	flex-shrink: 0;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
	padding: ${({ $variant }) => $variant === 'primary' ? '1rem 2.5rem' : '0.875rem 2rem'};
	border-radius: 12px;
	font-size: ${({ $variant }) => $variant === 'primary' ? '1.125rem' : '1rem'};
	font-weight: 700;
	cursor: pointer;
	transition: all 0.3s ease;
	border: none;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	white-space: nowrap;
	position: relative;
	overflow: hidden;

	${({ $variant }) =>
		$variant === 'primary'
			? `
				background: linear-gradient(135deg, #3b82f6, #2563eb);
				color: white;
				box-shadow: 0 6px 12px -2px rgba(59, 130, 246, 0.4);

				&:hover:not(:disabled) {
					transform: translateY(-2px);
					box-shadow: 0 10px 16px -2px rgba(59, 130, 246, 0.5);
				}

				&:disabled {
					opacity: 0.7;
					cursor: not-allowed;
					transform: none;
				}
			`
			: `
				background: #ffffff;
				color: #374151;
				border: 2px solid #d1d5db;

				&:hover {
					background: #f9fafb;
					border-color: #9ca3af;
				}
			`}
`;

const RedirectModal: React.FC<RedirectModalProps> = ({
	isOpen,
	onClose,
	url,
	redirectDelay = 10,
	title = 'Redirecting to PingOne',
	description = 'You will be redirected to PingOne for authentication. Complete the login process and you will be returned to this application.'
}) => {
	const [timeLeft, setTimeLeft] = useState(redirectDelay);
	const [isRedirecting, setIsRedirecting] = useState(false);

	useEffect(() => {
		if (!isOpen) {
			setTimeLeft(redirectDelay);
			setIsRedirecting(false);
			return;
		}

		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					setIsRedirecting(true);
					// Redirect after a brief delay to show the redirecting state
					setTimeout(() => {
						// Open in a centered popup window instead of a new tab
						const width = 600;
						const height = 700;
						const left = window.screen.width / 2 - width / 2;
						const top = window.screen.height / 2 - height / 2;
						
						window.open(
							url,
							'PingOneAuth',
							`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
						);
						onClose();
					}, 500);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [isOpen, redirectDelay, url, onClose]);

	const handleManualRedirect = () => {
		setIsRedirecting(true);
		setTimeout(() => {
			// Open in a centered popup window instead of a new tab
			const width = 600;
			const height = 700;
			const left = window.screen.width / 2 - width / 2;
			const top = window.screen.height / 2 - height / 2;
			
			window.open(
				url,
				'PingOneAuth',
				`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
			);
			onClose();
		}, 300);
	};

	const handleCancel = () => {
		onClose();
	};

	if (!isOpen) return null;

	return (
		<ModalOverlay>
			<ModalContainer>
				<ModalHeader>
					<ModalTitle>
						<FiExternalLink />
						{title}
					</ModalTitle>
					<CloseButton onClick={handleCancel} title="Cancel redirect">
						<FiX size={20} />
					</CloseButton>
				</ModalHeader>

				<ModalContent>
					<ModalDescription>{description}</ModalDescription>

					<URLSection>
						<URLTitle>
							<FiExternalLink />
							Authorization URL
						</URLTitle>
						<ColoredUrlDisplay
							url={url}
							title="PingOne Authorization URL"
							showCopyButton={true}
							showExplanationButton={false}
						/>
					</URLSection>

					<StatusSection>
						<StatusTitle>
							<FiCheck />
							{isRedirecting ? 'Redirecting...' : 'Ready to Redirect'}
						</StatusTitle>
						<StatusText>
							{isRedirecting
								? 'Opening PingOne authentication in a new tab...'
								: 'The authorization URL has been generated and is ready to use.'}
						</StatusText>
					</StatusSection>

					<TimerSection>
						<TimerTitle>
							<FiClock />
							Auto-redirect Timer
						</TimerTitle>
						<TimerDisplay>{timeLeft}</TimerDisplay>
						<TimerText>
							{isRedirecting
								? 'Redirecting now...'
								: timeLeft > 1
									? `seconds until automatic redirect (or click GO now)`
									: `second until automatic redirect (or click GO now)`}
						</TimerText>
					</TimerSection>

					<ModalActions>
						<ActionButton $variant="secondary" onClick={handleCancel}>
							Cancel
						</ActionButton>
						<ActionButton $variant="primary" onClick={handleManualRedirect} disabled={isRedirecting}>
							<FiExternalLink />
							{isRedirecting ? 'Redirecting...' : 'GO'}
						</ActionButton>
					</ModalActions>
				</ModalContent>
			</ModalContainer>
		</ModalOverlay>
	);
};

export default RedirectModal;
