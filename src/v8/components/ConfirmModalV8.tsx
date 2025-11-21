/**
 * @file ConfirmModalV8.tsx
 * @module v8/components
 * @description Simple confirmation modal for V8
 * @version 8.0.0
 * @since 2024-11-16
 */

import React from 'react';

interface ConfirmModalV8Props {
	isOpen: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
	variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModalV8: React.FC<ConfirmModalV8Props> = ({
	isOpen,
	title,
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	onConfirm,
	onCancel,
	variant = 'warning',
}) => {
	// Lock body scroll when modal is open
	React.useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const colors = {
		danger: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', button: '#ef4444' },
		warning: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e', button: '#f59e0b' },
		info: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af', button: '#3b82f6' },
	};

	const color = colors[variant];

	return (
		<>
			{/* Backdrop */}
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					zIndex: 999,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
				onClick={onCancel}
			/>

			{/* Modal */}
			<div
				style={{
					position: 'fixed',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					background: 'white',
					borderRadius: '8px',
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
					zIndex: 1000,
					maxWidth: '400px',
					width: '90%',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					style={{
						background: `linear-gradient(to right, ${color.bg} 0%, ${color.bg} 100%)`,
						padding: '20px 24px',
						borderBottom: `1px solid ${color.border}`,
						borderTopLeftRadius: '8px',
						borderTopRightRadius: '8px',
					}}
				>
					<h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: color.text }}>
						{title}
					</h2>
				</div>

				{/* Content */}
				<div style={{ padding: '24px' }}>
					<p
						style={{
							margin: 0,
							fontSize: '14px',
							color: '#374151',
							lineHeight: '1.6',
							whiteSpace: 'pre-line',
						}}
					>
						{message}
					</p>
				</div>

				{/* Actions */}
				<div
					style={{
						padding: '16px 24px',
						borderTop: '1px solid #e5e7eb',
						display: 'flex',
						gap: '8px',
						justifyContent: 'flex-end',
					}}
				>
					<button
						onClick={onCancel}
						style={{
							padding: '8px 16px',
							background: '#e5e7eb',
							color: '#1f2937',
							border: 'none',
							borderRadius: '4px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						{cancelText}
					</button>
					<button
						onClick={onConfirm}
						style={{
							padding: '8px 16px',
							background: color.button,
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						{confirmText}
					</button>
				</div>
			</div>
		</>
	);
};

export default ConfirmModalV8;
