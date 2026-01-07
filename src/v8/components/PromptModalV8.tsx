/**
 * @file PromptModalV8.tsx
 * @module v8/components
 * @description Prompt modal component - replaces window.prompt()
 * @version 8.0.0
 * @since 2024-11-23
 *
 * Features:
 * - Accessible modal dialog with input
 * - Keyboard support (ESC to cancel, Enter to submit)
 * - Input validation
 * - Integrates with UINotificationServiceV8
 *
 * @example
 * <PromptModalV8 />
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { type PromptOptions, uiNotificationServiceV8 } from '@/v8/services/uiNotificationServiceV8';

const MODULE_TAG = '[📝 PROMPT-MODAL-V8]';

export const PromptModalV8: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [options, setOptions] = useState<PromptOptions | null>(null);
	const [value, setValue] = useState('');
	const [resolver, setResolver] = useState<((value: string | null) => void) | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = useCallback(() => {
		console.log(`${MODULE_TAG} User submitted:`, value);
		if (resolver) {
			resolver(value.trim() || null);
		}
		setIsOpen(false);
		setOptions(null);
		setValue('');
		setResolver(null);
	}, [resolver, value]);

	const handleCancel = useCallback(() => {
		console.log(`${MODULE_TAG} User cancelled`);
		if (resolver) {
			resolver(null);
		}
		setIsOpen(false);
		setOptions(null);
		setValue('');
		setResolver(null);
	}, [resolver]);

	useEffect(() => {
		// Register handler with service
		const handler = (opts: PromptOptions): Promise<string | null> => {
			console.log(`${MODULE_TAG} Showing prompt:`, opts.message);
			return new Promise((resolve) => {
				setOptions(opts);
				setValue(opts.defaultValue || '');
				setIsOpen(true);
				setResolver(() => resolve);
			});
		};

		uiNotificationServiceV8.registerPromptHandler(handler);

		// Keyboard handler
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isOpen) return;

			if (e.key === 'Escape') {
				e.preventDefault();
				handleCancel();
			} else if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				handleSubmit();
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen, handleSubmit, handleCancel]);

	// Focus input when modal opens
	useEffect(() => {
		if (isOpen && inputRef.current) {
			setTimeout(() => {
				inputRef.current?.focus();
				inputRef.current?.select();
			}, 100);
		}
	}, [isOpen]);

	if (!isOpen || !options) {
		return null;
	}

	return (
		<>
			{/* Overlay */}
			<div
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
					role="dialog"
					aria-modal="true"
					aria-labelledby="prompt-title"
					aria-describedby="prompt-message"
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
							borderBottom: '2px solid #3b82f6',
						}}
					>
						<h3
							id="prompt-title"
							style={{
								margin: 0,
								fontSize: '18px',
								fontWeight: '600',
								color: '#1e40af', // Dark blue text on white background
							}}
						>
							{options.title || 'Enter Value'}
						</h3>
					</div>

					{/* Message */}
					<div
						id="prompt-message"
						style={{
							marginBottom: '16px',
							fontSize: '14px',
							color: '#374151', // Dark grey text on white background
							lineHeight: '1.5',
						}}
					>
						{options.message}
					</div>

					{/* Input */}
					<input
						ref={inputRef}
						type="text"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder={options.placeholder || 'Enter value...'}
						style={{
							width: '100%',
							padding: '10px 12px',
							border: '1px solid #d1d5db',
							borderRadius: '6px',
							fontSize: '14px',
							marginBottom: '24px',
							boxSizing: 'border-box',
							color: '#1f2937', // Dark text on white background
							background: '#ffffff', // White background
						}}
					/>

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
							onClick={handleSubmit}
							style={{
								padding: '8px 16px',
								background: '#3b82f6',
								color: 'white', // White text on blue background
								border: 'none',
								borderRadius: '6px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '600',
							}}
						>
							{options.confirmText || 'OK'}
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
						Press ESC to cancel, Enter to submit
					</div>
				</div>
			</div>
		</>
	);
};

export default PromptModalV8;
