// src/v8/components/MFACooldownModalV8.tsx
// Modal for displaying cooldown/lockout errors in MFA authentication

import React, { useEffect, useId } from 'react';
import styled from 'styled-components';
import { FiAlertCircle, FiClock, FiInfo, FiX } from '@/services/commonImportsService';
import { useDraggableModal } from '@/v8/hooks/useDraggableModal';

interface MFACooldownModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	message: string;
	deliveryMethod?: string;
	coolDownExpiresAt?: number;
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
	max-width: 560px;
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
	transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		background: #d97706;
		transform: translateY(-1px);
		box-shadow: 0 8px 18px rgba(17, 24, 39, 0.1);
	}

	&:focus-visible {
		outline: 3px solid rgba(59, 130, 246, 0.45);
		outline-offset: 2px;
	}
`;

const CooldownCallout = styled.div`
	margin-top: 1rem;
	padding: 1rem;
	background: #fef3c7;
	border-radius: 0.5rem;
	border-left: 4px solid #f59e0b;
	display: flex;
	gap: 0.75rem;
	align-items: flex-start;
`;

const CooldownIcon = styled.div`
	flex-shrink: 0;
	margin-top: 0.125rem;
`;

const CooldownContent = styled.div`
	flex: 1;
`;

const CooldownTitle = styled.p`
	margin: 0 0 0.5rem 0;
	font-weight: 600;
	font-size: 0.9rem;
	color: #92400e;
`;

const CooldownText = styled.p`
	margin: 0;
	font-size: 0.875rem;
	color: #78350f;
	line-height: 1.5;
`;

const InfoCallout = styled.div`
	margin-top: 1rem;
	padding: 1rem;
	background: #eff6ff;
	border-radius: 0.5rem;
	border-left: 4px solid #2563eb;
	display: flex;
	gap: 0.75rem;
	align-items: flex-start;
`;

const InfoIcon = styled.div`
	flex-shrink: 0;
	margin-top: 0.125rem;
`;

const InfoContent = styled.div`
	flex: 1;
`;

const InfoTitle = styled.p`
	margin: 0 0 0.5rem 0;
	font-weight: 600;
	font-size: 0.9rem;
	color: #1e40af;
`;

const InfoList = styled.ul`
	margin: 0;
	padding-left: 1.25rem;
	color: #1e3a8a;
	font-size: 0.875rem;
	line-height: 1.6;
`;

const InfoListItem = styled.li`
	margin-bottom: 0.35rem;
`;

export const MFACooldownModalV8: React.FC<MFACooldownModalV8Props> = ({
	isOpen,
	onClose,
	message,
	deliveryMethod,
	coolDownExpiresAt,
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

	useEffect(() => {
		if (!isOpen) {
			return undefined;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onClose]);

	const modalTitleId = useId();
	const { modalRef, modalPosition, handleMouseDown, modalStyle } = useDraggableModal(isOpen);

	if (!isOpen) {
		return null;
	}

	const hasPosition = modalPosition.x !== 0 || modalPosition.y !== 0;

	// Format time remaining
	const getTimeRemaining = (): string | null => {
		if (!coolDownExpiresAt) return null;
		try {
			const now = Date.now();
			const expiresAt = coolDownExpiresAt;
			const timeUntil = Math.max(0, Math.ceil((expiresAt - now) / 1000 / 60)); // minutes
			const lockUntil = new Date(expiresAt);
			return `${timeUntil} minute${timeUntil !== 1 ? 's' : ''} (until ${lockUntil.toLocaleTimeString()})`;
		} catch {
			return null;
		}
	};

	const timeRemaining = getTimeRemaining();

	return (
		<ModalOverlay role="presentation" onClick={onClose} $hasPosition={hasPosition}>
			<ModalContent
				ref={modalRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={modalTitleId}
				onClick={(event) => event.stopPropagation()}
				style={modalStyle}
			>
				<CloseButton type="button" aria-label="Close error details" onClick={onClose}>
					<FiX size={18} />
				</CloseButton>
				<ModalHeader onMouseDown={handleMouseDown}>
					<FiAlertCircle size={28} color="#f59e0b" />
					<div>
						<ModalTitle id={modalTitleId}>Temporarily Locked</ModalTitle>
						<p
							style={{
								margin: '0.5rem 0 0',
								color: '#6b7280',
								fontSize: '0.9rem',
								fontWeight: 'normal',
							}}
						>
							Too many authentication attempts
						</p>
					</div>
				</ModalHeader>
				<ModalBody>
					<p style={{ marginTop: 0 }}>{message}</p>

					{coolDownExpiresAt && timeRemaining && (
						<CooldownCallout>
							<CooldownIcon>
								<FiClock size={20} color="#f59e0b" />
							</CooldownIcon>
							<CooldownContent>
								<CooldownTitle>⏱️ Cooldown Period</CooldownTitle>
								<CooldownText>
									Please wait approximately <strong>{timeRemaining}</strong> before trying again.
								</CooldownText>
							</CooldownContent>
						</CooldownCallout>
					)}

					<InfoCallout>
						<InfoIcon>
							<FiInfo size={20} color="#2563eb" />
						</InfoIcon>
						<InfoContent>
							<InfoTitle>What you can do:</InfoTitle>
							<InfoList>
								<InfoListItem>
									<strong>Wait for the cooldown period:</strong> The lockout is temporary and will
									automatically expire.
								</InfoListItem>
								{deliveryMethod && deliveryMethod !== 'TOTP' && (
									<InfoListItem>
										<strong>Try a different device:</strong> If you have other registered devices
										(e.g.,{' '}
										{deliveryMethod === 'SMS'
											? 'Email or TOTP'
											: deliveryMethod === 'EMAIL'
												? 'SMS or TOTP'
												: 'SMS or Email'}
										), you can use them instead.
									</InfoListItem>
								)}
								<InfoListItem>
									<strong>Contact support:</strong> If you continue to experience issues, contact
									your administrator for assistance.
								</InfoListItem>
							</InfoList>
						</InfoContent>
					</InfoCallout>
				</ModalBody>
				<ModalFooter>
					<PrimaryButton type="button" onClick={onClose}>
						Understood
					</PrimaryButton>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};
