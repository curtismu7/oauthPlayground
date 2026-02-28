/**
 * @file TOTPExpiredModalV8.tsx
 * @module v8/components
 * @description Modal to inform users that TOTP QR code and secret have expired
 * @version 8.0.0
 *
 * TOTP secret and keyUri expire after 30 minutes from device creation.
 * This modal informs users and provides options to regenerate or go back.
 */

import React, { useEffect } from 'react';
import { FiAlertCircle, FiRefreshCw, FiX } from '@icons';
import styled from 'styled-components';
import { useDraggableModal } from '@/v8/hooks/useDraggableModal';

interface TOTPExpiredModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	onRegenerate: () => void;
	onGoBack: () => void;
}

const ModalOverlay = styled.div<{ $hasPosition: boolean }>`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.55);
	display: ${(props) => (props.$hasPosition ? 'block' : 'flex')};
	align-items: ${(props) => (props.$hasPosition ? 'normal' : 'center')};
	justify-content: ${(props) => (props.$hasPosition ? 'normal' : 'center')};
	z-index: 1050;
	padding: 1.5rem;
`;

const ModalContent = styled.div`
	background: #ffffff;
	border-radius: 1rem;
	max-width: 500px;
	width: 100%;
	box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
	padding: 2rem;
	position: relative;
	border-top: 6px solid #f59e0b;
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	margin-bottom: 1.25rem;
	cursor: grab;
	user-select: none;

	&:active {
		cursor: grabbing;
	}
`;

const ModalTitle = styled.h3`
	margin: 0;
	font-size: 1.35rem;
	font-weight: 700;
	color: #92400e;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ModalBody = styled.div`
	color: #1f2937;
	font-size: 0.975rem;
	line-height: 1.6;
`;

const ModalFooter = styled.div`
	margin-top: 1.5rem;
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
`;

const CloseButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	background: transparent;
	border: none;
	color: #6b7280;
	width: 2rem;
	height: 2rem;
	border-radius: 999px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: background 0.2s ease, color 0.2s ease;

	&:hover {
		background: rgba(148, 163, 184, 0.15);
		color: #374151;
	}

	&:focus-visible {
		outline: 3px solid rgba(59, 130, 246, 0.45);
		outline-offset: 2px;
	}
`;

const PrimaryButton = styled.button`
	background: #f59e0b;
	color: #ffffff;
	border: none;
	border-radius: 0.5rem;
	padding: 0.65rem 1.5rem;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	transition: background 0.2s ease, transform 0.1s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;

	&:hover {
		background: #d97706;
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
	}

	&:focus-visible {
		outline: 3px solid rgba(245, 158, 11, 0.45);
		outline-offset: 2px;
	}
`;

const SecondaryButton = styled.button`
	background: #f3f4f6;
	color: #374151;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	padding: 0.65rem 1.5rem;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	transition: background 0.2s ease;

	&:hover {
		background: #e5e7eb;
	}

	&:focus-visible {
		outline: 3px solid rgba(59, 130, 246, 0.45);
		outline-offset: 2px;
	}
`;

const WarningBox = styled.div`
	background: #fef3c7;
	border: 1px solid #fcd34d;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-bottom: 1.25rem;
`;

const WarningText = styled.p`
	margin: 0;
	color: #92400e;
	font-size: 0.9rem;
	line-height: 1.5;
`;

export const TOTPExpiredModalV8: React.FC<TOTPExpiredModalV8Props> = ({
	isOpen,
	onClose,
	onRegenerate,
	onGoBack,
}) => {
	// Lock body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	}, [isOpen]);

	// Handle ESC key to close modal
	useEffect(() => {
		if (!isOpen) return undefined;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	const modalTitleId = React.useId();
	const { modalRef, modalPosition, handleMouseDown, modalStyle } = useDraggableModal(isOpen);

	if (!isOpen) {
		return null;
	}

	const hasPosition = modalPosition.x !== 0 || modalPosition.y !== 0;

	return (
		<ModalOverlay role="presentation" onClick={onClose} $hasPosition={hasPosition}>
			<ModalContent
				ref={modalRef}
				style={modalStyle}
				role="dialog"
				aria-modal="true"
				aria-labelledby={modalTitleId}
				onClick={(e) => e.stopPropagation()}
			>
				<CloseButton
					type="button"
					onClick={onClose}
					aria-label="Close modal"
					onMouseDown={(e) => e.stopPropagation()}
				>
					<FiX size={18} />
				</CloseButton>

				<ModalHeader onMouseDown={handleMouseDown}>
					<ModalTitle id={modalTitleId}>
						<FiAlertCircle size={24} />
						QR Code & Secret Expired
					</ModalTitle>
				</ModalHeader>

				<ModalBody>
					<WarningBox>
						<WarningText>
							<strong>⚠️ Expiration Notice:</strong> The TOTP QR code and secret key have expired.
							According to{' '}
							<a
								href="https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-totp"
								target="_blank"
								rel="noopener noreferrer"
								style={{ color: '#92400e', textDecoration: 'underline' }}
							>
								PingOne API documentation
							</a>
							, both the secret and keyUri expire after 30 minutes from device creation. These
							properties are only returned if the device's activation status is ACTIVATION_REQUIRED.
						</WarningText>
					</WarningBox>

					<p style={{ margin: '0 0 1rem 0', color: '#374151' }}>
						To continue setting up your TOTP device, you have two options:
					</p>

					<ul style={{ margin: '0 0 1.5rem 0', paddingLeft: '1.5rem', color: '#374151' }}>
						<li style={{ marginBottom: '0.5rem' }}>
							<strong>Regenerate:</strong> Delete the current device and create a new one to get a
							fresh QR code and secret.
						</li>
						<li style={{ marginBottom: '0.5rem' }}>
							<strong>Go Back:</strong> Return to the device selection page to choose a different
							device or try again later.
						</li>
					</ul>
				</ModalBody>

				<ModalFooter>
					<SecondaryButton type="button" onClick={onGoBack}>
						Go Back
					</SecondaryButton>
					<PrimaryButton type="button" onClick={onRegenerate}>
						<FiRefreshCw size={18} />
						Regenerate QR Code
					</PrimaryButton>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};
