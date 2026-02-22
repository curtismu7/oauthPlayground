/**
 * @file AnimatedModal.tsx
 * @module v8/components
 * @description Modal component with smooth entrance/exit animations
 * @version 9.1.0
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { borderRadius, colors, shadows, spacing, typography } from '@/v8/design/tokens';

interface AnimatedModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	title?: string;
	maxWidth?: string;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
	isOpen,
	onClose,
	children,
	title,
	maxWidth = '600px',
}) => {
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setIsAnimating(true);
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}

		return () => {
			document.body.style.overflow = '';
		};
	}, [isOpen]);

	if (!isOpen && !isAnimating) return null;

	const handleClose = () => {
		setIsAnimating(false);
		setTimeout(onClose, 300);
	};

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	};

	return createPortal(
		<div
			role="button"
			tabIndex={0}
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 9999,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: spacing.lg,
			}}
			onClick={handleBackdropClick}
		>
			{/* Backdrop */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					opacity: isAnimating ? 1 : 0,
					transition: 'opacity 300ms ease',
				}}
			/>

			{/* Modal content */}
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={title ? 'modal-title' : undefined}
				style={{
					position: 'relative',
					background: 'white',
					borderRadius: borderRadius.xl,
					maxWidth,
					width: '100%',
					maxHeight: '90vh',
					overflow: 'auto',
					boxShadow: shadows['2xl'],
					transform: isAnimating ? 'scale(1)' : 'scale(0.95)',
					opacity: isAnimating ? 1 : 0,
					transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
				}}
			>
				{title && (
					<div
						style={{
							padding: spacing.xl,
							borderBottom: `1px solid ${colors.neutral[200]}`,
						}}
					>
						<h2
							id="modal-title"
							style={{
								margin: 0,
								fontSize: typography.fontSize.xl,
								fontWeight: typography.fontWeight.semibold,
								color: colors.neutral[900],
							}}
						>
							{title}
						</h2>
					</div>
				)}
				<div style={{ padding: spacing.xl }}>{children}</div>
			</div>
		</div>,
		document.body
	);
};
