/**
 * @file CreatePolicyModalV8.tsx
 * @module v8/components
 * @description Modal for creating a new Device Authentication Policy
 * @version 8.0.0
 */

import { FiX } from '@icons';
import React, { useEffect, useRef, useState } from 'react';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[📝 CREATE-POLICY-MODAL-V8]';

interface CreatePolicyModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	onSave: (name: string, description: string) => Promise<void>;
	isSaving?: boolean;
}

export const CreatePolicyModalV8: React.FC<CreatePolicyModalV8Props> = ({
	isOpen,
	onClose,
	onSave,
	isSaving = false,
}) => {
	const [policyName, setPolicyName] = useState('');
	const [policyDescription, setPolicyDescription] = useState('');
	const nameInputRef = useRef<HTMLInputElement>(null);

	// Reset form when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setPolicyName('');
			setPolicyDescription('');
			// Focus name input when modal opens
			setTimeout(() => {
				nameInputRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	// Handle ESC key
	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen && !isSaving) {
				onClose();
			}
		};
		window.addEventListener('keydown', handleEsc);
		return () => window.removeEventListener('keydown', handleEsc);
	}, [isOpen, isSaving, onClose]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!policyName.trim()) {
			toastV8.error('Policy name is required');
			return;
		}
		try {
			await onSave(policyName.trim(), policyDescription.trim());
			// Form will be reset by useEffect when modal closes
		} catch (error) {
			// Error handling is done in parent component
			console.error(`${MODULE_TAG} Failed to create policy:`, error);
		}
	};

	if (!isOpen) return null;

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
					zIndex: 1000,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
				onClick={(e) => {
					if (e.target === e.currentTarget && !isSaving) {
						onClose();
					}
				}}
			>
				{/* Modal */}
				<div
					style={{
						background: 'white',
						borderRadius: '12px',
						width: '90%',
						maxWidth: '500px',
						maxHeight: '90vh',
						display: 'flex',
						flexDirection: 'column',
						boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div
						style={{
							padding: '20px 24px',
							borderBottom: '1px solid #e5e7eb',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
							borderRadius: '12px 12px 0 0',
						}}
					>
						<h2
							style={{
								margin: 0,
								fontSize: '20px',
								fontWeight: '600',
								color: 'white',
							}}
						>
							Create New Policy
						</h2>
						<button
							type="button"
							onClick={onClose}
							disabled={isSaving}
							style={{
								background: 'rgba(255, 255, 255, 0.2)',
								border: 'none',
								borderRadius: '6px',
								width: '32px',
								height: '32px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: isSaving ? 'not-allowed' : 'pointer',
								color: 'white',
								transition: 'background 0.2s',
							}}
							onMouseEnter={(e) => {
								if (!isSaving) {
									e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
								}
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
							}}
						>
							<FiX size={18} />
						</button>
					</div>

					{/* Body */}
					<form onSubmit={handleSubmit}>
						<div
							style={{
								padding: '24px',
								overflowY: 'auto',
								flex: 1,
							}}
						>
							{/* Policy Name */}
							<div style={{ marginBottom: '20px' }}>
								<label
									htmlFor="policy-name"
									style={{
										display: 'block',
										marginBottom: '8px',
										fontSize: '14px',
										fontWeight: '600',
										color: '#374151',
									}}
								>
									Policy Name <span style={{ color: '#ef4444' }}>*</span>
								</label>
								<input
									ref={nameInputRef}
									id="policy-name"
									type="text"
									value={policyName}
									onChange={(e) => setPolicyName(e.target.value)}
									disabled={isSaving}
									placeholder="Enter policy name (e.g., 'Production MFA Policy')"
									required
									style={{
										width: '100%',
										padding: '10px 12px',
										border: '2px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '14px',
										background: isSaving ? '#f3f4f6' : 'white',
										color: '#1f2937',
										outline: 'none',
										transition: 'border-color 0.2s',
									}}
									onFocus={(e) => {
										e.currentTarget.style.borderColor = '#3b82f6';
									}}
									onBlur={(e) => {
										e.currentTarget.style.borderColor = '#d1d5db';
									}}
								/>
								<small
									style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}
								>
									A descriptive name for this policy
								</small>
							</div>

							{/* Policy Description */}
							<div style={{ marginBottom: '20px' }}>
								<label
									htmlFor="policy-description"
									style={{
										display: 'block',
										marginBottom: '8px',
										fontSize: '14px',
										fontWeight: '600',
										color: '#374151',
									}}
								>
									Description (Optional)
								</label>
								<textarea
									id="policy-description"
									value={policyDescription}
									onChange={(e) => setPolicyDescription(e.target.value)}
									disabled={isSaving}
									placeholder="Enter a description for this policy"
									rows={3}
									style={{
										width: '100%',
										padding: '10px 12px',
										border: '2px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '14px',
										fontFamily: 'inherit',
										background: isSaving ? '#f3f4f6' : 'white',
										color: '#1f2937',
										resize: 'vertical',
										outline: 'none',
										transition: 'border-color 0.2s',
									}}
									onFocus={(e) => {
										e.currentTarget.style.borderColor = '#3b82f6';
									}}
									onBlur={(e) => {
										e.currentTarget.style.borderColor = '#d1d5db';
									}}
								/>
								<small
									style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}
								>
									Optional description to help identify this policy
								</small>
							</div>
						</div>

						{/* Footer */}
						<div
							style={{
								padding: '16px 24px',
								borderTop: '1px solid #e5e7eb',
								display: 'flex',
								gap: '12px',
								justifyContent: 'flex-end',
							}}
						>
							<button
								type="button"
								onClick={onClose}
								disabled={isSaving}
								style={{
									padding: '10px 20px',
									background: '#f3f4f6',
									color: '#374151',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									fontWeight: '600',
									cursor: isSaving ? 'not-allowed' : 'pointer',
									opacity: isSaving ? 0.5 : 1,
								}}
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isSaving || !policyName.trim()}
								style={{
									padding: '10px 20px',
									background: isSaving || !policyName.trim() ? '#9ca3af' : '#10b981',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '14px',
									fontWeight: '600',
									cursor: isSaving || !policyName.trim() ? 'not-allowed' : 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								}}
							>
								{isSaving ? (
									<>
										<span>⏳</span>
										<span>Creating...</span>
									</>
								) : (
									<>
										<span>✓</span>
										<span>Create Policy</span>
									</>
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</>
	);
};
