/**
 * @file UnifiedDeviceRegistrationForm.tsx
 * @module v8/flows/unified/components
 * @description Combined device type selection + info input form
 * @version 9.2.0
 * @since 2026-01-29
 *
 * Purpose: Single form showing all device types with their input fields
 * Users can see all options and fill in the appropriate fields in one view
 */

import React, { useCallback, useState, useEffect } from 'react';
import { Button } from '@/v8/components/Button';
import { PageTransition } from '@/v8/components/PageTransition';
import { getDeviceConfig } from '@/v8/config/deviceFlowConfigs';
import type { DeviceConfigKey } from '@/v8/config/deviceFlowConfigTypes';
import type { TokenStatusInfo } from '@/v8/services/workerTokenStatusServiceV8';
import { colors, spacing } from '@/v8/styles/designTokens';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { APIComparisonModal } from './APIComparisonModal';
import { DynamicFormRenderer } from './DynamicFormRenderer';
import FIDO2RegistrationModal from '@/components/FIDO2RegistrationModal';
import '../UnifiedMFAFlow.css';

const MODULE_TAG = '[📝 UNIFIED-DEVICE-REG-FORM]';

interface DeviceTypeTab {
	key: DeviceConfigKey;
	icon: string;
	label: string;
	description: string;
}

const DEVICE_TABS: DeviceTypeTab[] = [
	{ key: 'SMS', icon: '📱', label: 'SMS', description: 'Text message verification' },
	{ key: 'EMAIL', icon: '✉️', label: 'Email', description: 'Email verification' },
	{ key: 'TOTP', icon: '🔐', label: 'Authenticator', description: 'App-based codes' },
	{ key: 'MOBILE', icon: '📲', label: 'Mobile Push', description: 'Push notifications' },
	{ key: 'WHATSAPP', icon: '💬', label: 'WhatsApp', description: 'WhatsApp messages' },
	{ key: 'FIDO2', icon: '🔑', label: 'Security Key / FIDO2', description: 'Hardware key/passkey' },
];

type FlowType = 'admin' | 'admin_activation_required' | 'user';

export interface UnifiedDeviceRegistrationFormProps {
	onSubmit: (
		deviceType: DeviceConfigKey,
		fields: Record<string, string>,
		flowType: FlowType
	) => void;
	onCancel: () => void;
	isLoading?: boolean;
	/** Initial device type to select (defaults to SMS) */
	initialDeviceType?: DeviceConfigKey;
	/** Token status for validation */
	tokenStatus: TokenStatusInfo;
	/** Registration error to display */
	registrationError?: string | null;
	/** Callback to clear error */
	onClearError?: () => void;
	/** Username for FIDO2 registration */
	username?: string;
}

export const UnifiedDeviceRegistrationForm: React.FC<UnifiedDeviceRegistrationFormProps> = ({
	onSubmit,
	onCancel,
	isLoading = false,
	initialDeviceType = 'SMS',
	tokenStatus,
	registrationError,
	onClearError,
	username,
}) => {
	const [selectedTab, setSelectedTab] = useState<DeviceConfigKey>(initialDeviceType);
	const [flowType, setFlowType] = useState<FlowType>('admin');
	
	// Debug logging for flowType changes
	useEffect(() => {
		console.log('🔍 [FLOW TYPE DEBUG] flowType state changed:', flowType);
	}, [flowType]);
	
	// Debug logging on mount
	useEffect(() => {
		console.log('🔍 [FLOW TYPE DEBUG] UnifiedDeviceRegistrationForm mounted');
		console.log('🔍 [FLOW TYPE DEBUG] Initial flowType:', flowType);
		console.log('🔍 [FLOW TYPE DEBUG] Initial selectedTab:', selectedTab);
	}, []);
	
	// File upload state
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [filePreview, setFilePreview] = useState<string | null>(null);

	const [deviceFields, setDeviceFields] = useState<Record<DeviceConfigKey, Record<string, string>>>(
		() => {
			// Initialize with saved values from localStorage
			const savedPhone = localStorage.getItem('mfa_saved_phoneNumber');
			const savedCountryCode = localStorage.getItem('mfa_saved_countryCode');
			const savedEmail = localStorage.getItem('mfa_saved_email');

			const initialFields: Record<DeviceConfigKey, Record<string, string>> = {
				SMS: { name: 'SMS', nickname: 'MyKnickName' },
				EMAIL: { name: 'EMAIL', nickname: 'MyKnickName' },
			};

			// Restore saved values if available
			if (savedPhone) {
				initialFields.SMS = { ...initialFields.SMS, phoneNumber: savedPhone };
			}
			if (savedCountryCode) {
				initialFields.SMS = { ...initialFields.SMS, countryCode: savedCountryCode };
				initialFields.SMS.countryCode = savedCountryCode;
				initialFields.WHATSAPP.countryCode = savedCountryCode;
			}
			if (savedEmail) {
				initialFields.EMAIL.email = savedEmail;
			}

			return initialFields;
		}
	);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [showApiModal, setShowApiModal] = useState(false);
	const [showFido2Modal, setShowFido2Modal] = useState(false);

	const config = getDeviceConfig(selectedTab);

	const handleFieldChange = useCallback(
		(field: string, value: string) => {
			setDeviceFields((prev) => ({
				...prev,
				[selectedTab]: {
					...prev[selectedTab],
					[field]: value,
				},
			}));
			// Clear error for this field
			if (errors[field]) {
				setErrors((prev) => {
					const newErrors = { ...prev };
					delete newErrors[field];
					return newErrors;
				});
			}
		},
		[selectedTab, errors]
	);

	const handleSubmit = useCallback(() => {
		console.log(`${MODULE_TAG} Submitting registration for:`, selectedTab, 'Flow type:', flowType);
		const fields = deviceFields[selectedTab];
		
		// ========== DEBUG: FORM SUBMISSION ==========
		console.log('🔍 [FORM DEBUG] Submit handler called:', {
			selectedTab,
			flowType,
			fields,
			tokenIsValid: tokenStatus.isValid,
			hasOnSubmit: !!onSubmit
		});
		// ============================================

		// Check worker token status
		if (!tokenStatus.isValid) {
			toastV8.error('Worker token is invalid or expired. Please refresh the worker token.');
			console.log('🔍 [FORM DEBUG] Token invalid, blocking submission');
			return;
		}

		// Basic validation
		const requiredFields = config.requiredFields || [];
		const newErrors: Record<string, string> = {};

		requiredFields.forEach((field) => {
			if (!fields[field]?.trim()) {
				newErrors[field] = `${field} is required`;
			}
		});

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			console.log('🔍 [FORM DEBUG] Validation errors:', newErrors);
			return;
		}
		
		console.log('🔍 [FORM DEBUG] Calling onSubmit callback');
		
		// Special handling for FIDO2
		if (selectedTab === 'FIDO2') {
			setShowFido2Modal(true);
			return;
		}
		
		onSubmit(selectedTab, fields, flowType);
	}, [selectedTab, deviceFields, config, onSubmit, flowType, tokenStatus]);
	
	const handleFido2Success = useCallback(
		(credentialId: string, publicKey: string) => {
			console.log(`${MODULE_TAG} FIDO2 registration successful`, { credentialId });
			toastV8.success('FIDO2 device registered successfully!');
			setShowFido2Modal(false);
			
			// Update device fields with FIDO2 data
			const fido2Fields = {
				...deviceFields.FIDO2,
				credentialId,
				publicKey,
			};
			
			// Submit FIDO2 registration
			onSubmit('FIDO2', fido2Fields, flowType);
		},
		[deviceFields, flowType, onSubmit]
	);

	// File upload handler
	const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		console.log(`${MODULE_TAG} File upload triggered`);
		const file = event.target.files?.[0];
		if (!file) return;

		console.log(`${MODULE_TAG} File selected:`, { name: file.name, type: file.type, size: file.size });

		// Validate file type (images only)
		if (!file.type.startsWith('image/')) {
			toastV8.error('Please select an image file (JPG, PNG, etc.)');
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toastV8.error('File size must be less than 5MB');
			return;
		}

		setUploadedFile(file);

		// Create preview
		const reader = new FileReader();
		reader.onload = (e) => {
			setFilePreview(e.target?.result as string);
			console.log(`${MODULE_TAG} File preview created`);
		};
		reader.readAsDataURL(file);

		// Add file to device fields
		setDeviceFields(prev => ({
			...prev,
			[selectedTab]: {
				...prev[selectedTab],
				imageFile: file.name,
				imageSize: file.size.toString(),
				imageType: file.type
			}
		}));

		toastV8.success(`Image uploaded: ${file.name}`);
	}, [selectedTab, setDeviceFields]);

	// Clear file handler
	const clearFile = useCallback(() => {
		setUploadedFile(null);
		setFilePreview(null);
		setDeviceFields(prev => {
			const updated = { ...prev };
			delete updated[selectedTab].imageFile;
			delete updated[selectedTab].imageSize;
			delete updated[selectedTab].imageType;
			return updated;
		});
	}, [selectedTab, setDeviceFields]);

	return (
		<PageTransition>
			<div style={{ maxWidth: '900px', margin: '0 auto', padding: spacing[6] }}>
				{/* Header */}
				<div style={{ marginBottom: spacing[6] }}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'flex-start',
							marginBottom: spacing[2],
						}}
					>
						<div>
							<h2
								style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: colors.gray[900] }}
							>
								Register MFA Device
							</h2>
							<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: colors.gray[600] }}>
								Select a device type and enter the required information
							</p>
						</div>
						<Button
							variant="secondary"
							onClick={() => setShowApiModal(true)}
							style={{ fontSize: '12px', padding: '8px 12px' }}
						>
							🔍 API Comparison
						</Button>
					</div>
				</div>

				{/* Flow Type Selection */}
				<div
					style={{
						background: '#ffffff',
						border: `1px solid ${colors.gray[200]}`,
						borderRadius: '12px',
						padding: spacing[4],
						marginBottom: spacing[6],
					}}
				>
					<h3
						style={{
							margin: `0 0 ${spacing[3]}`,
							fontSize: '16px',
							fontWeight: '600',
							color: colors.gray[900],
						}}
					>
						Registration Flow Type
					</h3>
					<div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
						{/* Admin Flow */}
						<label
							style={{
								display: 'flex',
								alignItems: 'flex-start',
								gap: spacing[2],
								padding: spacing[3],
								border: `2px solid ${flowType === 'admin' ? colors.primary[500] : colors.gray[200]}`,
								borderRadius: '8px',
								cursor: 'pointer',
								background: flowType === 'admin' ? colors.primary[50] : 'transparent',
								transition: 'all 0.2s ease',
							}}
						>
							<input
								type="radio"
								name="flowType"
								value="admin"
								checked={flowType === 'admin'}
								onChange={(e) => {
									console.log('🔍 [FLOW TYPE DEBUG] Admin Flow radio selected');
									console.log('🔍 [FLOW TYPE DEBUG] New value:', e.target.value);
									setFlowType(e.target.value as FlowType);
								}}
								style={{ marginTop: '2px', cursor: 'pointer' }}
							/>
							<div>
								<div style={{ fontWeight: '600', color: colors.gray[900], marginBottom: '4px' }}>
									Admin Flow (Direct Registration)
								</div>
								<div style={{ fontSize: '13px', color: colors.gray[600] }}>
									Register device directly as admin. Device is immediately active and ready to use.
								</div>
							</div>
						</label>

						{/* Admin with Activation Required - Hide for FIDO2 (no OTP activation needed) */}
						{selectedTab !== 'FIDO2' && (
							<label
								style={{
									display: 'flex',
									alignItems: 'flex-start',
									gap: spacing[2],
									padding: spacing[3],
									border: `2px solid ${flowType === 'admin_activation_required' ? colors.primary[500] : colors.gray[200]}`,
									borderRadius: '8px',
									cursor: 'pointer',
									background:
										flowType === 'admin_activation_required' ? colors.primary[50] : 'transparent',
									transition: 'all 0.2s ease',
								}}
							>
								<input
									type="radio"
									name="flowType"
									value="admin_activation_required"
									checked={flowType === 'admin_activation_required'}
									onChange={(e) => {
										console.log('🔍 [FLOW TYPE DEBUG] Admin ACTIVATION_REQUIRED radio selected');
										console.log('🔍 [FLOW TYPE DEBUG] New value:', e.target.value);
										setFlowType(e.target.value as FlowType);
									}}
									style={{ marginTop: '2px', cursor: 'pointer' }}
								/>
								<div>
									<div style={{ fontWeight: '600', color: colors.gray[900], marginBottom: '4px' }}>
										Admin Flow with Activation Required
									</div>
									<div style={{ fontSize: '13px', color: colors.gray[600] }}>
										Register device as admin, but require user activation (OTP verification) before
										it's active.
									</div>
								</div>
							</label>
						)}

						{/* User Flow */}
						<label
							style={{
								display: 'flex',
								alignItems: 'flex-start',
								gap: spacing[2],
								padding: spacing[3],
								border: `2px solid ${flowType === 'user' ? colors.primary[500] : colors.gray[200]}`,
								borderRadius: '8px',
								cursor: 'pointer',
								background: flowType === 'user' ? colors.primary[50] : 'transparent',
								transition: 'all 0.2s ease',
							}}
						>
							<input
								type="radio"
								name="flowType"
								value="user"
								checked={flowType === 'user'}
								onChange={(e) => {
									console.log('🔍 [FLOW TYPE DEBUG] User Flow radio selected');
									console.log('🔍 [FLOW TYPE DEBUG] New value:', e.target.value);
									setFlowType(e.target.value as FlowType);
								}}
								style={{ marginTop: '2px', cursor: 'pointer' }}
							/>
							<div>
								<div style={{ fontWeight: '600', color: colors.gray[900], marginBottom: '4px' }}>
									User Flow (PingOne Authentication)
								</div>
								<div style={{ fontSize: '13px', color: colors.gray[600] }}>
									User registers their own device. Redirects to PingOne for authentication before
									registration.
								</div>
							</div>
						</label>
					</div>
				</div>

				{/* Device Type Tabs */}
				<div
					style={{
						display: 'flex',
						gap: spacing[2],
						marginBottom: spacing[4],
						borderBottom: `2px solid ${colors.gray[200]}`,
						overflowX: 'auto',
						paddingBottom: spacing[2],
					}}
				>
					{DEVICE_TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => setSelectedTab(tab.key)}
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: spacing[1],
								padding: `${spacing[2]} ${spacing[3]}`,
								background: selectedTab === tab.key ? colors.primary[50] : 'transparent',
								border: 'none',
								borderBottom:
									selectedTab === tab.key
										? `3px solid ${colors.primary[600]}`
										: '3px solid transparent',
								borderRadius: '8px 8px 0 0',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								minWidth: '100px',
								marginBottom: '-2px',
							}}
						>
							<span style={{ fontSize: '24px' }}>{tab.icon}</span>
							<span
								style={{
									fontSize: '13px',
									fontWeight: selectedTab === tab.key ? '600' : '500',
									color: selectedTab === tab.key ? colors.primary[700] : colors.gray[600],
									whiteSpace: 'nowrap',
								}}
							>
								{tab.label}
							</span>
						</button>
					))}
				</div>

				{/* Device Description */}
				<div
					style={{
						background: colors.primary[50],
						border: `1px solid ${colors.primary[200]}`,
						borderRadius: '8px',
						padding: spacing[3],
						marginBottom: spacing[4],
					}}
				>
					<p style={{ margin: 0, fontSize: '14px', color: colors.primary[900] }}>
						<strong>{config.displayName}:</strong>{' '}
						{config.description || DEVICE_TABS.find((t) => t.key === selectedTab)?.description}
					</p>
				</div>

				{/* Device-Specific Form */}
				<div
					style={{
						background: '#ffffff',
						border: `1px solid ${colors.gray[200]}`,
						borderRadius: '12px',
						padding: spacing[4],
						marginBottom: spacing[6],
					}}
				>
					{config.deviceType === 'FIDO2' ? (
						<div
							style={{
								padding: spacing[6],
								textAlign: 'center',
							}}
						>
							<p style={{ fontSize: '48px', margin: `0 0 ${spacing[3]}` }}>🔑</p>
							<h3 style={{ margin: `0 0 ${spacing[2]}`, fontSize: '18px', fontWeight: '600', color: colors.gray[900] }}>
								FIDO2 Security Key / Passkey
							</h3>
							<p style={{ margin: `0 0 ${spacing[4]}`, fontSize: '14px', color: colors.gray[600] }}>
								Register a hardware security key, platform authenticator, or passkey
							</p>
							<DynamicFormRenderer
								config={config}
								values={deviceFields[selectedTab] || {}}
								onChange={handleFieldChange}
								errors={errors}
							/>
							<p style={{ margin: `${spacing[4]} 0 0 0`, fontSize: '13px', color: colors.gray[500] }}>
								ℹ️ Click "Register Security Key" below to start the WebAuthn registration flow
							</p>
						</div>
					) : (
						<DynamicFormRenderer
							config={config}
							values={deviceFields[selectedTab] || {}}
							onChange={handleFieldChange}
							errors={errors}
						/>
					)}

					{/* File Upload Section */}
					<div style={{
						marginTop: spacing[4],
						padding: spacing[4],
						background: '#f8fafc',
						border: `1px solid ${colors.gray[200]}`,
						borderRadius: '8px',
					}}>
						{(() => {
							console.log(`${MODULE_TAG} Rendering file upload section`);
							return null;
						})()}
						<h4 style={{ margin: `0 0 ${spacing[3]}`, fontSize: '16px', fontWeight: '600', color: colors.gray[900] }}>
							📷 Upload Image (Optional)
						</h4>
						<p style={{ margin: `0 0 ${spacing[3]}`, fontSize: '14px', color: colors.gray[600] }}>
							Upload an image file for device identification (JPG, PNG, max 5MB)
						</p>
						
						{filePreview ? (
							<div style={{ marginBottom: spacing[3] }}>
								<img 
									src={filePreview} 
									alt="Preview" 
									style={{ 
										maxWidth: '200px', 
										maxHeight: '200px', 
										borderRadius: '8px',
										border: `1px solid ${colors.gray[300]}`
									}}
								/>
								<div style={{ marginTop: spacing[2] }}>
									<p style={{ margin: 0, fontSize: '12px', color: colors.gray[600] }}>
										{uploadedFile?.name} ({(uploadedFile?.size ? (uploadedFile.size / 1024).toFixed(1) : '0')} KB)
									</p>
									<button
										type="button"
										onClick={clearFile}
										style={{
											padding: '6px 12px',
											background: colors.danger[500],
											color: 'white',
											border: 'none',
											borderRadius: '4px',
											fontSize: '12px',
											cursor: 'pointer'
										}}
									>
										Remove Image
									</button>
								</div>
							</div>
						) : (
							<div>
								<input
									type="file"
									id="image-upload"
									accept="image/*"
									onChange={handleFileUpload}
									style={{ display: 'none' }}
								/>
								<label
									htmlFor="image-upload"
									style={{
										display: 'inline-block',
										padding: '10px 16px',
										background: colors.primary[500],
										color: 'white',
										borderRadius: '6px',
										cursor: 'pointer',
										fontSize: '14px',
										transition: 'background-color 0.2s'
									}}
									onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.primary[600]}
									onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.primary[500]}
								>
									📁 Choose Image File
								</label>
							</div>
						)}
					</div>
				</div>

				{/* Registration Error Display */}
				{registrationError && (
					<div style={{
						padding: '16px',
						background: '#fef2f2',
						border: '2px solid #fca5a5',
						borderRadius: '8px',
						marginBottom: '20px',
					}}>
						<div style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'flex-start',
							marginBottom: '12px',
						}}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<span style={{ fontSize: '20px' }}>⚠️</span>
								<strong style={{ color: '#991b1b', fontSize: '15px' }}>Registration Failed</strong>
							</div>
							{onClearError && (
								<button
									type="button"
									onClick={onClearError}
									style={{
										background: 'none',
										border: 'none',
										color: '#991b1b',
										cursor: 'pointer',
										fontSize: '18px',
										padding: '0',
									}}
								>
									×
								</button>
							)}
						</div>
						<p style={{ margin: '0 0 12px 0', color: '#7f1d1d', fontSize: '14px', lineHeight: '1.5' }}>
							{registrationError}
						</p>
						{registrationError.includes('Too many devices') && (
							<div style={{
								padding: '12px',
								background: '#fff',
								border: '1px solid #fca5a5',
								borderRadius: '6px',
								marginTop: '12px',
							}}>
								<p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#7f1d1d', fontWeight: '600' }}>
									💡 Need to manage your devices?
								</p>
								<a
									href="/v8/delete-all-devices"
									style={{
										display: 'inline-block',
										padding: '8px 16px',
										background: '#dc2626',
										color: 'white',
										textDecoration: 'none',
										borderRadius: '6px',
										fontSize: '14px',
										fontWeight: '600',
									}}
								>
									Go to Device Management →
								</a>
							</div>
						)}
					</div>
				)}

				{/* Registration Info */}
				<div style={{ 
					padding: '12px 16px', 
					background: '#eff6ff', 
					border: '1px solid #bfdbfe',
					borderRadius: '6px',
					marginBottom: '16px',
					fontSize: '14px',
					color: '#1e40af'
				}}>
					ℹ️ Clicking "Register {config.displayName} →" will register your device and send the activation code.
				</div>

				{/* Action Buttons */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						paddingTop: spacing[4],
						borderTop: `1px solid ${colors.gray[200]}`,
					}}
				>
					<Button variant="secondary" onClick={onCancel} disabled={isLoading}>
						Cancel
					</Button>
					<Button variant="primary" onClick={handleSubmit} disabled={isLoading} loading={isLoading}>
					{flowType === 'user' ? `Continue to User Login →` : `Register ${config.displayName} →`}
					</Button>
				</div>
			</div>
			
			{/* API Comparison Modal */}
			<APIComparisonModal isOpen={showApiModal} onClose={() => setShowApiModal(false)} />
			
			{/* FIDO2 Registration Modal */}
			<FIDO2RegistrationModal
				isOpen={showFido2Modal}
				onClose={() => setShowFido2Modal(false)}
				onSuccess={handleFido2Success}
				userId={username || deviceFields.FIDO2?.userId || 'default-user'}
				deviceName={deviceFields.FIDO2?.name || 'Security Key'}
			/>
		</PageTransition>
	);
};

export default UnifiedDeviceRegistrationForm;
