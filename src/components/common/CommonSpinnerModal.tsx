/**
 * @file CommonSpinnerModal.tsx
 * @module components/common
 * @description Modal variant of the common spinner component
 * @version 1.0.0
 */

import React from 'react';
import type { CommonSpinnerProps } from '@/types/spinner';
import { CommonSpinner } from './CommonSpinner';

interface CommonSpinnerModalProps extends Omit<CommonSpinnerProps, 'variant'> {
	isOpen: boolean;
	onClose?: () => void;
	preventClose?: boolean;
}

/**
 * Modal variant of the CommonSpinner component
 * Used for blocking operations that require user attention
 */
export const CommonSpinnerModal: React.FC<CommonSpinnerModalProps> = ({
	isOpen,
	onClose,
	preventClose = false,
	...spinnerProps
}) => {
	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget && !preventClose && onClose) {
			onClose();
		}
	};

	const handleDismiss = () => {
		if (!preventClose && onClose) {
			onClose();
		}
	};

	if (!isOpen) {
		return null;
	}

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="spinner-message"
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				background: 'rgba(0, 0, 0, 0.5)',
				backdropFilter: 'blur(4px)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 10000,
				animation: 'fadeIn 0.3s ease-out',
			}}
			onClick={handleBackdropClick}
			onKeyDown={(e) => {
				if (e.key === 'Escape' && !preventClose && onClose) {
					onClose();
				}
			}}
		>
			<CommonSpinner
				variant="modal"
				allowDismiss={!preventClose}
				onDismiss={handleDismiss}
				{...spinnerProps}
			/>

			<style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
		</div>
	);
};

export default CommonSpinnerModal;
