// src/components/LoginSuccessModal.tsx
import React from 'react';
import { FiCheckCircle, FiX } from '@icons';
import styled from 'styled-components';

interface LoginSuccessModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	message?: string;
	autoCloseDelay?: number;
}

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
	align-items: center;
	justify-content: center;
	z-index: 1000;
	backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	max-width: 400px;
	width: 90%;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
	position: relative;
	text-align: center;
	animation: slideUp 0.3s ease-out;

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
`;

const CloseButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	background: none;
	border: none;
	color: #6b7280;
	cursor: pointer;
	padding: 0.5rem;
	border-radius: 6px;
	transition: all 0.2s ease;
	z-index: 10;

	&:hover {
		background: #f3f4f6;
		color: #374151;
	}

	&:active {
		transform: scale(0.95);
	}
`;

const SuccessIcon = styled.div`
	width: 64px;
	height: 64px;
	background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1.5rem;
	color: white;
	font-size: 28px;
	animation: bounceIn 0.6s ease-out;

	@keyframes bounceIn {
		0% {
			transform: scale(0.3);
			opacity: 0;
		}
		50% {
			transform: scale(1.05);
		}
		70% {
			transform: scale(0.9);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
`;

const ModalTitle = styled.h2`
	color: #1f2937;
	font-size: 1.5rem;
	font-weight: 600;
	margin: 0 0 0.5rem;
`;

const ModalMessage = styled.p`
	color: #6b7280;
	font-size: 1rem;
	line-height: 1.5;
	margin: 0 0 1.5rem;
`;

const ActionButton = styled.button`
	background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
	color: white;
	border: none;
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
	}
`;

const LoginSuccessModal: React.FC<LoginSuccessModalProps> = ({
	isOpen,
	onClose,
	title = 'Login Successful!',
	message = 'You have been successfully authenticated with PingOne. You can now proceed with the OAuth flow.',
	autoCloseDelay = 3000,
}) => {
	const handleClose = () => {
		console.log('🔴 [LoginSuccessModal] Close button clicked');
		onClose();
	};
	// Auto-close after delay
	React.useEffect(() => {
		if (isOpen && autoCloseDelay > 0) {
			const timer = setTimeout(() => {
				onClose();
			}, autoCloseDelay);

			return () => clearTimeout(timer);
		}
	}, [isOpen, autoCloseDelay, onClose]);

	// Close on escape key
	React.useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			return () => document.removeEventListener('keydown', handleEscape);
		}
	}, [isOpen, onClose]);

	// Close on overlay click
	const handleOverlayClick = (event: React.MouseEvent) => {
		if (event.target === event.currentTarget) {
			console.log('🔴 [LoginSuccessModal] Overlay clicked');
			onClose();
		}
	};

	return (
		<ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
			<ModalContainer>
				<CloseButton onClick={handleClose} aria-label="Close modal">
					<FiX size={20} />
				</CloseButton>

				<SuccessIcon>
					<FiCheckCircle />
				</SuccessIcon>

				<ModalTitle>{title}</ModalTitle>
				<ModalMessage>{message}</ModalMessage>

				<ActionButton onClick={handleClose}>Continue</ActionButton>
			</ModalContainer>
		</ModalOverlay>
	);
};

export default LoginSuccessModal;
