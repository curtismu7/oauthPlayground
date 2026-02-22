/**
 * @file ConfirmationModalV8.tsx
 * @module v8/components
 * @description Confirmation modal component - replaces window.confirm()
 * @version 8.0.0
 * @since 2024-11-23
 *
 * Features:
 * - Accessible modal dialog
 * - Keyboard support (ESC to cancel, Enter to confirm)
 * - Customizable buttons and severity
 * - Integrates with UINotificationServiceV8
 *
 * @example
 * <ConfirmationModalV8 />
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
	type ConfirmOptions,
	uiNotificationServiceV8,
} from '@/v8/services/uiNotificationServiceV8';

const MODULE_TAG = '[✅ CONFIRMATION-MODAL-V8]';

export const ConfirmationModalV8: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [options, setOptions] = useState<ConfirmOptions | null>(null);
	const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

	const handleConfirm = useCallback(() => {
		console.log(`${MODULE_TAG} User confirmed`);
		if (resolver) {
			resolver(true);
		}
		setIsOpen(false);
		setOptions(null);
		setResolver(null);
	}, [resolver]);

	const handleCancel = useCallback(() => {
		console.log(`${MODULE_TAG} User cancelled`);
		if (resolver) {
			resolver(false);
		}
		setIsOpen(false);
		setOptions(null);
		setResolver(null);
	}, [resolver]);

	useEffect(() => {
		// Register handler with service
		const handler = (opts: ConfirmOptions): Promise<boolean> => {
			console.log(`${MODULE_TAG} Showing confirmation:`, opts.message);
			return new Promise((resolve) => {
				setOptions(opts);
				setIsOpen(true);
				setResolver(() => resolve);
			});
		};

		uiNotificationServiceV8.registerConfirmHandler(handler);

		// Keyboard handler
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen) return;

			if (e.key === 'Escape') {
				e.preventDefault();
				handleCancel();
			} else if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				handleConfirm();
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen, handleConfirm, handleCancel]);

	if (!isOpen || !options) {
		return null;
	}

	const severityColors = {
		warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
		danger: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
		info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
	};

	const colors = severityColors[options.severity || 'warning'];

	return (
		<>
			{/* Overlay */}
			<div
				role="button"
				tabIndex={0}
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 10000,
				}}
				onClick={handleCancel}
			>
				{/* Modal */}
				<div
					role="button"
					tabIndex={0}
					role="dialog"
					aria-modal="true"
					aria-labelledby="confirm-title"
					aria-describedby="confirm-message"
					onClick={(e) => e.stopPropagation()}
					style={{
						background: 'white',
						borderRadius: '8px',
						padding: '24px',
						maxWidth: '500px',
						width: '90%',
						boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
					}}
				>
					{/* Header */}
					<div
						style={{
							marginBottom: '16px',
							paddingBottom: '12px',
							borderBottom: `2px solid ${colors.border}`,
						}}
					>
						<h3
							id="confirm-title"
							style={{
								margin: 0,
								fontSize: '18px',
								fontWeight: '600',
								color: colors.text, // Dark text on light background
							}}
						>
							{options.title || 'Confirm Action'}
						</h3>
					</div>

					{/* Message */}
					<div
						id="confirm-message"
						style={{
							marginBottom: '24px',
							fontSize: '14px',
							color: '#374151', // Dark grey text on white background
							lineHeight: '1.5',
							whiteSpace: 'pre-wrap',
						}}
					>
						{options.message}
					</div>

					{/* Buttons */}
					<div
						style={{
							display: 'flex',
							gap: '12px',
							justifyContent: 'flex-end',
						}}
					>
						<button
							type="button"
							onClick={handleCancel}
							style={{
								padding: '8px 16px',
								background: '#f3f4f6', // Light grey background
								color: '#374151', // Dark text on light background
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '500',
							}}
						>
							{options.cancelText || 'Cancel'}
						</button>
						<button
							type="button"
							onClick={handleConfirm}
							style={{
								padding: '8px 16px',
								background: options.severity === 'danger' ? '#ef4444' : '#3b82f6',
								color: 'white', // White text on colored background
								border: 'none',
								borderRadius: '6px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '600',
							}}
						>
							{options.confirmText || 'Confirm'}
						</button>
					</div>

					{/* Keyboard hint */}
					<div
						style={{
							marginTop: '16px',
							fontSize: '11px',
							color: '#9ca3af', // Light grey text
							textAlign: 'center',
						}}
					>
						Press ESC to cancel, Enter to confirm
					</div>
				</div>
			</div>
		</>
	);
};

export default ConfirmationModalV8;
