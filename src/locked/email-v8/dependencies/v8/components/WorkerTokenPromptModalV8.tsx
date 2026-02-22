/**
 * @file WorkerTokenPromptModalV8.tsx
 * @module v8/components
 * @description Modal that prompts user to get a new worker token when one is missing
 * @version 8.0.0
 */

import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { PINGONE_WORKER_MFA_SCOPE_STRING } from '../config/constants.ts';

const _MODULE_TAG = '[🔑 WORKER-TOKEN-PROMPT-MODAL-V8]';

interface WorkerTokenPromptModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	onGetToken: () => void;
}

export const WorkerTokenPromptModalV8: React.FC<WorkerTokenPromptModalV8Props> = ({
	isOpen,
	onClose,
	onGetToken,
}) => {
	if (!isOpen) return null;

	const handleGetToken = () => {
		onGetToken();
		onClose();
	};

	const handleCancel = () => {
		onClose();
	};

	// Handle ESC key
	React.useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				handleCancel();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, handleCancel]);

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
					aria-labelledby="worker-token-prompt-title"
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
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: '16px',
							paddingBottom: '12px',
							borderBottom: '2px solid #dc2626',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							<div
								style={{
									background: '#dc2626',
									color: 'white',
									padding: '8px',
									borderRadius: '8px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<FiAlertTriangle size={24} />
							</div>
							<h3
								id="worker-token-prompt-title"
								style={{
									margin: 0,
									fontSize: '18px',
									fontWeight: '600',
									color: '#1f2937',
								}}
							>
								Worker Token Required
							</h3>
						</div>
						<button
							type="button"
							onClick={handleCancel}
							style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: '4px',
								borderRadius: '4px',
								color: '#6b7280',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
							aria-label="Close modal"
						>
							<FiX size={20} />
						</button>
					</div>

					{/* Message */}
					<div
						style={{
							marginBottom: '24px',
							fontSize: '14px',
							color: '#374151',
							lineHeight: '1.6',
						}}
					>
						<p style={{ margin: '0 0 12px 0' }}>
							Failed to get worker token. Please configure worker token credentials first.
						</p>
						<p style={{ margin: '0 0 12px 0' }}>
							<strong>Note:</strong> For MFA device management, your worker token must include:
							<code
								style={{
									display: 'block',
									marginTop: '8px',
									padding: '8px',
									background: '#f3f4f6',
									borderRadius: '4px',
									fontSize: '12px',
								}}
							>
								{PINGONE_WORKER_MFA_SCOPE_STRING}
							</code>
						</p>
						<p style={{ margin: 0 }}>Would you like to get a new worker token now?</p>
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
								padding: '10px 20px',
								background: '#f3f4f6',
								color: '#374151',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '500',
								transition: 'background 120ms ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#e5e7eb';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#f3f4f6';
							}}
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleGetToken}
							style={{
								padding: '10px 20px',
								background: '#2563eb',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '600',
								transition: 'background 120ms ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#1e40af';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#2563eb';
							}}
						>
							Get Worker Token
						</button>
					</div>
				</div>
			</div>
		</>
	);
};
