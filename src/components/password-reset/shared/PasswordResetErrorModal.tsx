// src/components/password-reset/shared/PasswordResetErrorModal.tsx
// Shared modal for surfacing password reset errors in a user-friendly way

import React, { useEffect, useId } from 'react';
import styled from 'styled-components';
import { FiAlertCircle, FiX } from '../../../services/commonImportsService';

export interface PasswordResetErrorInfo {
	title: string;
	message: string;
	detail?: string;
	suggestion?: string;
	severity?: 'error' | 'warning';
}

interface PasswordResetErrorModalProps {
	error: PasswordResetErrorInfo | null;
	onClose: () => void;
}

const ModalOverlay = styled.div`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.55);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1050;
	padding: 1.5rem;
`;

const ModalContent = styled.div<{ $severity: 'error' | 'warning' }>`
	background: #ffffff;
	border-radius: 1rem;
	max-width: 520px;
	width: 100%;
	box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
	padding: 2rem;
	position: relative;
	border-top: 6px solid ${({ $severity }) => ($severity === 'error' ? '#dc2626' : '#f59e0b')};
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
`;

const ModalTitle = styled.h3<{ $severity: 'error' | 'warning' }>`
	margin: 0;
	font-size: 1.35rem;
	font-weight: 700;
	color: ${({ $severity }) => ($severity === 'error' ? '#991b1b' : '#92400e')};
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

const PrimaryButton = styled.button<{ $severity: 'error' | 'warning' }>`
	background: ${({ $severity }) => ($severity === 'error' ? '#dc2626' : '#d97706')};
	color: #ffffff;
	border: none;
	border-radius: 0.5rem;
	padding: 0.65rem 1.5rem;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

	&:hover {
		background: ${({ $severity }) => ($severity === 'error' ? '#b91c1c' : '#b45309')};
		transform: translateY(-1px);
		box-shadow: 0 8px 18px rgba(17, 24, 39, 0.1);
	}

	&:focus-visible {
		outline: 3px solid rgba(59, 130, 246, 0.45);
		outline-offset: 2px;
	}
`;

const HighlightCallout = styled.div<{ $severity: 'error' | 'warning' }>`
	margin-top: 1rem;
	padding: 0.85rem 1rem;
	border-radius: 0.75rem;
	background: ${({ $severity }) => ($severity === 'error' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(245, 158, 11, 0.12)')};
	color: ${({ $severity }) => ($severity === 'error' ? '#991b1b' : '#92400e')};
	border: 1px solid ${({ $severity }) => ($severity === 'error' ? 'rgba(220, 38, 38, 0.35)' : 'rgba(245, 158, 11, 0.35)')};
`;

export const PasswordResetErrorModal: React.FC<PasswordResetErrorModalProps> = ({
	error,
	onClose,
}) => {
	useEffect(() => {
		if (!error) {
			return undefined;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [error, onClose]);

	const modalTitleId = useId();

	if (!error) {
		return null;
	}

	const severity: 'error' | 'warning' = error.severity ?? 'error';

	return (
		<ModalOverlay role="presentation" onClick={onClose}>
			<ModalContent
				$severity={severity}
				role="dialog"
				aria-modal="true"
				aria-labelledby={modalTitleId}
				onClick={(event) => event.stopPropagation()}
			>
				<CloseButton type="button" aria-label="Close error details" onClick={onClose}>
					<FiX size={18} />
				</CloseButton>
				<ModalHeader>
					<FiAlertCircle size={28} color={severity === 'error' ? '#dc2626' : '#f59e0b'} />
					<ModalTitle id={modalTitleId} $severity={severity}>
						{error.title}
					</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p style={{ marginTop: 0 }}>{error.message}</p>

					{error.detail && <HighlightCallout $severity={severity}>{error.detail}</HighlightCallout>}

					{error.suggestion && (
						<p style={{ marginTop: '1.25rem', color: '#374151' }}>
							<strong>What you can do:</strong> {error.suggestion}
						</p>
					)}
				</ModalBody>
				<ModalFooter>
					<PrimaryButton type="button" onClick={onClose} $severity={severity}>
						Got it
					</PrimaryButton>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};

export default PasswordResetErrorModal;
