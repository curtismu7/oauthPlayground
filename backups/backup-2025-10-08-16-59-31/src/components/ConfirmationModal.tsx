import React, { useEffect } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #f3f4f6;
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalMessage = styled.p`
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'danger':
				return `
          background-color: #dc2626;
          color: white;
          border-color: #dc2626;
          
          &:hover:not(:disabled) {
            background-color: #b91c1c;
            border-color: #b91c1c;
          }
        `;
			case 'primary':
				return `
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
          
          &:hover:not(:disabled) {
            background-color: #2563eb;
            border-color: #2563eb;
          }
        `;
			default:
				return `
          background-color: white;
          color: #374151;
          border-color: #d1d5db;
          
          &:hover:not(:disabled) {
            background-color: #f9fafb;
            border-color: #9ca3af;
          }
        `;
		}
	}}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface ConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: 'primary' | 'danger';
	isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	variant = 'primary',
	isLoading = false,
}) => {
	// Handle ESC key to close modal
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			return () => document.removeEventListener('keydown', handleEscape);
		}
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const handleConfirm = () => {
		onConfirm();
		onClose();
	};

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContainer onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<ModalTitle>
						<FiAlertTriangle />
						{title}
					</ModalTitle>
					<CloseButton onClick={onClose}>
						<FiX size={20} />
					</CloseButton>
				</ModalHeader>

				<ModalBody>
					<ModalMessage>{message}</ModalMessage>

					<ButtonGroup>
						<Button onClick={onClose} disabled={isLoading}>
							{cancelText}
						</Button>
						<Button $variant={variant} onClick={handleConfirm} disabled={isLoading}>
							{isLoading ? 'Processing...' : confirmText}
						</Button>
					</ButtonGroup>
				</ModalBody>
			</ModalContainer>
		</ModalOverlay>
	);
};

export default ConfirmationModal;
