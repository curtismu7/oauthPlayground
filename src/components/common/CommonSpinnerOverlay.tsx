/**
 * @file CommonSpinnerOverlay.tsx
 * @module components/common
 * @description Full-screen overlay variant of the common spinner component
 * @version 1.0.0
 */

import React from 'react';
import type { CommonSpinnerProps } from '@/types/spinner';
import { CommonSpinner } from './CommonSpinner';

interface CommonSpinnerOverlayProps extends Omit<CommonSpinnerProps, 'variant'> {
	isOpen: boolean;
	onClose?: () => void;
	preventClose?: boolean;
}

/**
 * Full-screen overlay variant of the CommonSpinner component
 * Used for full-page loading states or critical operations
 */
export const CommonSpinnerOverlay: React.FC<CommonSpinnerOverlayProps> = ({
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

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape' && !preventClose && onClose) {
			onClose();
		}
	};

	if (!isOpen) {
		return null;
	}

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				background: 'rgba(0, 0, 0, 0.7)',
				backdropFilter: 'blur(8px)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 10001,
				animation: 'fadeIn 0.3s ease-out',
			}}
			onClick={handleBackdropClick}
			onKeyDown={handleKeyDown}
			role="dialog"
			aria-modal="true"
			aria-labelledby="spinner-message"
		>
			<CommonSpinner
				variant="overlay"
				size="xl"
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

export default CommonSpinnerOverlay;
