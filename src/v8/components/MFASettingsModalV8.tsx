import React, { useEffect, useState } from 'react';
import { FiSettings, FiX } from 'react-icons/fi';
import { MFAServiceV8, type MFASettings } from '@/v8/services/mfaServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { useDraggableModal } from '@/v8/hooks/useDraggableModal';

interface MFASettingsModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	environmentId: string;
}

export const MFASettingsModalV8: React.FC<MFASettingsModalV8Props> = ({
	isOpen,
	onClose,
	environmentId,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [settings, setSettings] = useState<MFASettings>({});

	// Lock body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	}, [isOpen]);

	// Handle ESC key to close modal
	useEffect(() => {
		if (!isOpen) return undefined;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (isOpen && environmentId) {
			fetchSettings();
		}
	}, [isOpen, environmentId]);

	const fetchSettings = async () => {
		setIsLoading(true);
		try {
			const data = await MFAServiceV8.getMFASettings(environmentId);
			setSettings(data);
		} catch (error) {
			console.error('Failed to fetch MFA settings', error);
			toastV8.error('Failed to fetch MFA settings');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await MFAServiceV8.updateMFASettings(environmentId, settings);
			toastV8.success('MFA settings updated successfully');
			onClose();
		} catch (error) {
			console.error('Failed to update MFA settings', error);
			toastV8.error('Failed to update MFA settings');
		} finally {
			setIsSaving(false);
		}
	};

	const { modalRef, modalPosition, handleMouseDown, modalStyle } = useDraggableModal(isOpen);

	if (!isOpen) return null;

	const hasPosition = modalPosition.x !== 0 || modalPosition.y !== 0;

	return (
		<div 
			className="modal-overlay" 
			style={hasPosition ? { display: 'block' } : {}}
		>
			<div 
				className="modal-content"
				ref={modalRef}
				style={modalStyle}
			>
				<div className="modal-header" onMouseDown={handleMouseDown} style={{ cursor: 'grab', userSelect: 'none' }}>
					<h3>
						<FiSettings style={{ marginRight: '8px' }} />
						MFA Settings
					</h3>
					<button 
						onMouseDown={(e) => e.stopPropagation()}
						onClick={onClose} 
						className="close-button" 
						aria-label="Close modal"
					>
						<FiX />
					</button>
				</div>

				<div className="modal-body">
					{isLoading ? (
						<div className="loading-state">Loading settings...</div>
					) : (
						<div className="settings-form">
							<div className="form-section">
								<h4>Pairing</h4>
								<div className="form-group">
									<label>Max Allowed Devices</label>
									<input
										type="number"
										value={settings.pairing?.maxAllowedDevices ?? ''}
										onChange={(e) =>
											setSettings({
												...settings,
												pairing: {
													...settings.pairing,
													maxAllowedDevices: parseInt(e.target.value) || 0,
												},
											})
										}
									/>
								</div>
								<div className="form-group">
									<label>Pairing Key Format</label>
									<select
										value={settings.pairing?.pairingKeyFormat || 'NUMERIC'}
										onChange={(e) =>
											setSettings({
												...settings,
												pairing: {
													...settings.pairing,
													pairingKeyFormat: e.target.value,
												},
											})
										}
									>
										<option value="NUMERIC">Numeric (User Code)</option>
										<option value="QR_CODE">QR Code</option>
										<option value="ALPHANUMERIC">Alphanumeric</option>
									</select>
								</div>
							</div>

							<div className="form-section">
								<h4>Lockout</h4>
								<div className="form-group">
									<label>Failure Count</label>
									<input
										type="number"
										value={settings.lockout?.failureCount ?? ''}
										onChange={(e) =>
											setSettings({
												...settings,
												lockout: {
													...settings.lockout,
													failureCount: parseInt(e.target.value) || 0,
												},
											})
										}
									/>
								</div>
								<div className="form-group">
									<label>Duration (Seconds)</label>
									<input
										type="number"
										value={settings.lockout?.durationSeconds ?? ''}
										onChange={(e) =>
											setSettings({
												...settings,
												lockout: {
													...settings.lockout,
													durationSeconds: parseInt(e.target.value) || 0,
												},
											})
										}
									/>
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="modal-footer">
					<button onClick={onClose} className="btn btn-secondary" disabled={isSaving}>
						Close
					</button>
					<button onClick={handleSave} className="btn btn-primary" disabled={isSaving || isLoading}>
						{isSaving ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</div>

			<style>{`
				.modal-overlay {
					position: fixed;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: rgba(0, 0, 0, 0.5);
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 1000;
				}
				.modal-content {
					background: white;
					border-radius: 8px;
					width: 90%;
					max-width: 500px;
					max-height: 90vh;
					overflow-y: auto;
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
					margin: 0;
				}
				.modal-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 16px 24px;
					border-bottom: 1px solid #e5e7eb;
				}
				.modal-header:active {
					cursor: grabbing;
				}
				.modal-header h3 {
					margin: 0;
					display: flex;
					align-items: center;
					font-size: 18px;
					color: #1f2937;
				}
				.close-button {
					background: none;
					border: none;
					cursor: pointer;
					font-size: 20px;
					color: #6b7280;
					padding: 4px;
				}
				.modal-body {
					padding: 24px;
				}
				.form-section {
					margin-bottom: 24px;
					padding-bottom: 16px;
					border-bottom: 1px solid #f3f4f6;
				}
				.form-section:last-child {
					border-bottom: none;
					margin-bottom: 0;
					padding-bottom: 0;
				}
				.form-section h4 {
					margin: 0 0 16px 0;
					color: #374151;
					font-size: 16px;
				}
				.form-group {
					margin-bottom: 16px;
				}
				.form-group label {
					display: block;
					margin-bottom: 6px;
					font-size: 14px;
					font-weight: 500;
					color: #4b5563;
				}
				.form-group input,
				.form-group select {
					width: 100%;
					padding: 8px 12px;
					border: 1px solid #d1d5db;
					border-radius: 6px;
					font-size: 14px;
				}
				.modal-footer {
					padding: 16px 24px;
					border-top: 1px solid #e5e7eb;
					display: flex;
					justify-content: flex-end;
					gap: 12px;
					background: #f9fafb;
					border-radius: 0 0 8px 8px;
				}
				.btn {
					padding: 8px 16px;
					border-radius: 6px;
					font-weight: 500;
					cursor: pointer;
					border: none;
					font-size: 14px;
				}
				.btn-primary {
					background: #10b981;
					color: white;
				}
				.btn-primary:hover {
					background: #059669;
				}
				.btn-primary:disabled {
					background: #d1d5db;
					cursor: not-allowed;
				}
				.btn-secondary {
					background: white;
					border: 1px solid #d1d5db;
					color: #374151;
				}
				.btn-secondary:hover {
					background: #f3f4f6;
				}
				.loading-state {
					text-align: center;
					padding: 20px;
					color: #6b7280;
				}
			`}</style>
		</div>
	);
};
