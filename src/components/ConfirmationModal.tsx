import React from 'react';
import styled from 'styled-components';
import { DraggableModal } from './DraggableModal';

const ModalMessage = styled.p`
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.625rem 1.125rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'danger':
				return `
          background-color: #dc2626;
          color: #ffffff;
          border-color: #dc2626;
          
          &:hover:not(:disabled) {
            background-color: #b91c1c;
            border-color: #b91c1c;
          }
        `;
			case 'primary':
				return `
          background-color: #3b82f6;
          color: #ffffff;
          border-color: #2563eb;
          
          &:hover:not(:disabled) {
            background-color: #2563eb;
            border-color: #1d4ed8;
          }
        `;
			default:
				return `
          background-color: #3b82f6;
          color: #ffffff;
          border-color: #2563eb;
          
          &:hover:not(:disabled) {
            background-color: #2563eb;
            border-color: #1d4ed8;
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
	const handleConfirm = () => {
		onConfirm();
		onClose();
	};

	return (
		<DraggableModal isOpen={isOpen} onClose={onClose} title={title} width="500px" maxHeight="90vh">
			<div>
				<ModalMessage>{message}</ModalMessage>
				<ButtonGroup>
					<Button onClick={onClose} disabled={isLoading}>
						{cancelText}
					</Button>
					<Button $variant={variant} onClick={handleConfirm} disabled={isLoading}>
						{isLoading ? 'Processing...' : confirmText}
					</Button>
				</ButtonGroup>
			</div>
		</DraggableModal>
	);
};

export default ConfirmationModal;
