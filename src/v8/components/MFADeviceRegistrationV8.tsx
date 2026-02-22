/**
 * @file MFADeviceRegistrationV8.tsx
 * @module v8/components
 * @description Generic MFA device registration component using centralized service
 * @version 8.0.0
 * @since 2024-11-30
 */

import React, { useEffect, useState } from 'react';
import { MFAInfoButtonV8 } from '@/apps/mfa/components/MFAInfoButtonV8';
import {
	type DeviceType,
	type MFACredentials,
	type MFAState,
} from '@/apps/mfa/flows/shared/MFATypes';
import { type DeviceRegistrationResult, MFAServiceV8 } from '@/apps/mfa/services/mfaServiceV8';
import { CountryCodePickerV8 } from '@/v8/components/CountryCodePickerV8';
import { validateAndNormalizePhone } from '@/v8/utils/phoneValidationV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[🔧 MFA-DEVICE-REGISTRATION-V8]';

interface MFADeviceRegistrationV8Props {
	deviceType: DeviceType;
	credentials: MFACredentials;
	mfaState: MFAState;
	setMfaState: (update: Partial<MFAState> | ((prev: MFAState) => Partial<MFAState>)) => void;
	onComplete: (deviceId: string) => void;
	onCancel: () => void;
	isLoading?: boolean;
	setIsLoading?: (loading: boolean) => void;
}

type RegistrationStep = 'configure' | 'verify' | 'success';

export const MFADeviceRegistrationV8: React.FC<MFADeviceRegistrationV8Props> = ({
	deviceType,
	credentials,
	mfaState,
	setMfaState,
	onComplete,
	onCancel,
	isLoading = false,
	setIsLoading,
}) => {
	const [currentStep, setCurrentStep] = useState<RegistrationStep>('configure');
	const [registrationResult, setRegistrationResult] = useState<DeviceRegistrationResult | null>(
		null
	);
	const [otpCode, setOtpCode] = useState('');
	const [deviceConfig, setDeviceConfig] = useState({
		deviceName: deviceType,
		phoneNumber: '',
		countryCode: '+1',
		email: '',
		// FIDO2 specific
		fido2Config: {
			displayName: '',
			userVerification: 'preferred' as 'required' | 'preferred' | 'discouraged',
			authenticatorAttachment: 'cross-platform' as 'platform' | 'cross-platform',
		},
		// TOTP specific
		totpConfig: {
			qrCodeSize: 200,
			includeSecret: true,
		},
	});
	const [validationErrors, setValidationErrors] = useState<string[]>([]);

	// Reset state when device type changes
	useEffect(() => {
		setCurrentStep('configure');
		setRegistrationResult(null);
		setOtpCode('');
		setDeviceConfig({
			deviceName: deviceType,
			phoneNumber: '',
			countryCode: '+1',
			email: '',
			// FIDO2 specific
			fido2Config: {
				displayName: '',
				userVerification: 'preferred' as 'required' | 'preferred' | 'discouraged',
				authenticatorAttachment: 'cross-platform' as 'platform' | 'cross-platform',
			},
			// TOTP specific
			totpConfig: {
				qrCodeSize: 200,
				includeSecret: true,
			},
		});
		setValidationErrors([]);
	}, [deviceType]);

	const validateConfiguration = (): boolean => {
		const errors: string[] = [];

		// Common validation
		if (!deviceConfig.deviceName?.trim()) {
			errors.push('Device name is required');
		}

		// Device-specific validation
		switch (deviceType) {
			case 'SMS':
			case 'VOICE':
				if (!deviceConfig.phoneNumber?.trim()) {
					errors.push('Phone number is required');
				} else {
					// Use phone validation utility to handle multiple formats
					const phoneValidation = validateAndNormalizePhone(
						deviceConfig.phoneNumber,
						deviceConfig.countryCode || '+1'
					);
					if (!phoneValidation.isValid) {
						errors.push(phoneValidation.error || 'Invalid phone number format');
					}
				}
				break;

			case 'EMAIL':
				if (!deviceConfig.email?.trim()) {
					errors.push('Email address is required');
				} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deviceConfig.email)) {
					errors.push('Please enter a valid email address format');
				}
				break;
		}

		setValidationErrors(errors);
		return errors.length === 0;
	};

	const handleStartRegistration = async () => {
		if (!validateConfiguration()) {
			return;
		}

		if (!credentials.environmentId?.trim() || !credentials.username?.trim()) {
			toastV8.error('Environment ID and username are required');
			return;
		}

		setIsLoading?.(true);
		setValidationErrors([]);

		try {
			const result = await MFAServiceV8.registerDevice({
				...credentials,
				type: deviceType,
				name: deviceConfig.deviceName,
				phone: deviceConfig.phoneNumber,
				email: deviceConfig.email,
			});

			setRegistrationResult(result);
			setMfaState({
				...mfaState,
				deviceId: result.deviceId,
				deviceStatus: result.status,
			});

			if (result.status === 'ACTIVATION_REQUIRED') {
				setCurrentStep('verify');
				toastV8.success(
					result.message || 'Device registered successfully. Please verify with OTP.'
				);
			} else {
				setCurrentStep('success');
				onComplete(result.deviceId);
				toastV8.success(result.message || 'Device registered and activated successfully!');
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error(`${MODULE_TAG} Registration failed`, error);
			setValidationErrors([errorMessage]);
			toastV8.error(`Registration failed: ${errorMessage}`);
		} finally {
			setIsLoading?.(false);
		}
	};

	const handleCompleteRegistration = async () => {
		if (
			!registrationResult ||
			!credentials.environmentId?.trim() ||
			!credentials.username?.trim()
		) {
			toastV8.error('Missing required information for device activation');
			return;
		}

		if (registrationResult.status === 'ACTIVATION_REQUIRED' && !otpCode.trim()) {
			setValidationErrors(['OTP code is required']);
			return;
		}

		setIsLoading?.(true);
		setValidationErrors([]);

		try {
			await MFAServiceV8.activateDevice({
				...credentials,
				deviceId: registrationResult.deviceId,
				otp: otpCode.trim(),
			});

			setCurrentStep('success');
			onComplete(registrationResult.deviceId);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error(`${MODULE_TAG} Registration completion failed`, error);
			setValidationErrors([errorMessage]);
			toastV8.error(`Device activation failed: ${errorMessage}`);
		} finally {
			setIsLoading?.(false);
		}
	};

	const renderConfigurationStep = () => (
		<div style={{ padding: '20px', maxWidth: '500px' }}>
			<h2 style={{ marginBottom: '20px', color: '#1f2937' }}>Register {deviceType} Device</h2>

			{validationErrors.length > 0 && (
				<div
					style={{
						padding: '12px',
						backgroundColor: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '6px',
						marginBottom: '20px',
					}}
				>
					{validationErrors.map((error, index) => (
						<div key={index} style={{ color: '#dc2626', fontSize: '14px', marginBottom: '4px' }}>
							• {error}
						</div>
					))}
				</div>
			)}

			<div style={{ marginBottom: '16px' }}>
				<label
					style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}
				>
					Device Name
					<MFAInfoButtonV8 contentKey="device.name" displayMode="tooltip" />
				</label>
				<input
					type="text"
					value={deviceConfig.deviceName}
					onChange={(e) => setDeviceConfig({ ...deviceConfig, deviceName: e.target.value })}
					placeholder={`Enter a name for your ${String(deviceType)} device`}
					style={{
						width: '100%',
						padding: '10px',
						border: `1px solid ${
							validationErrors.length > 0 && !deviceConfig.deviceName?.trim()
								? '#ef4444'
								: '#d1d5db'
						}`,
						borderRadius: '6px',
						fontSize: '14px',
					}}
				/>
			</div>

			{(deviceType === 'SMS' || deviceType === 'VOICE') && (
				<>
					<div style={{ marginBottom: '16px' }}>
						<label
							style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}
						>
							Country Code
							<MFAInfoButtonV8 contentKey="phone.country" displayMode="tooltip" />
						</label>
						<CountryCodePickerV8
							value={deviceConfig.countryCode}
							onChange={(countryCode) => setDeviceConfig({ ...deviceConfig, countryCode })}
						/>
					</div>

					<div style={{ marginBottom: '16px' }}>
						<label
							style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}
						>
							Phone Number
							<MFAInfoButtonV8 contentKey="phone.number" displayMode="tooltip" />
						</label>
						<input
							type="tel"
							value={deviceConfig.phoneNumber}
							onChange={(e) => setDeviceConfig({ ...deviceConfig, phoneNumber: e.target.value })}
							placeholder="Enter phone number"
							style={{
								width: '100%',
								padding: '10px',
								border: `1px solid ${
									validationErrors.some((msg) => msg.toLowerCase().includes('phone number'))
										? '#ef4444'
										: '#d1d5db'
								}`,
								borderRadius: '6px',
								fontSize: '14px',
							}}
						/>
					</div>
				</>
			)}

			{deviceType === 'EMAIL' && (
				<div style={{ marginBottom: '16px' }}>
					<label
						style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}
					>
						Email Address
						<MFAInfoButtonV8 contentKey="email.address" displayMode="tooltip" />
					</label>
					<input
						type="email"
						value={deviceConfig.email}
						onChange={(e) => setDeviceConfig({ ...deviceConfig, email: e.target.value })}
						placeholder="Enter email address"
						style={{
							width: '100%',
							padding: '10px',
							border: `1px solid ${
								validationErrors.some(
									(msg) =>
										msg.toLowerCase().includes('email address') ||
										msg.toLowerCase().includes('email')
								)
									? '#ef4444'
									: '#d1d5db'
							}`,
							borderRadius: '6px',
							fontSize: '14px',
						}}
					/>
				</div>
			)}

			{deviceType === 'FIDO2' && (
				<>
					<div style={{ marginBottom: '16px' }}>
						<label
							style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}
						>
							Device Display Name
							<MFAInfoButtonV8 contentKey="fido2.displayName" displayMode="tooltip" />
						</label>
						<input
							type="text"
							value={deviceConfig.fido2Config.displayName}
							onChange={(e) =>
								setDeviceConfig({
									...deviceConfig,
									fido2Config: { ...deviceConfig.fido2Config, displayName: e.target.value },
								})
							}
							placeholder="My FIDO2 Security Key"
							style={{
								width: '100%',
								padding: '10px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
							}}
						/>
					</div>

					<div style={{ marginBottom: '16px' }}>
						<label
							style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}
						>
							User Verification
							<MFAInfoButtonV8 contentKey="fido2.userVerification" displayMode="tooltip" />
						</label>
						<select
							value={deviceConfig.fido2Config.userVerification}
							onChange={(e) =>
								setDeviceConfig({
									...deviceConfig,
									fido2Config: {
										...deviceConfig.fido2Config,
										userVerification: e.target.value as 'required' | 'preferred' | 'discouraged',
									},
								})
							}
							style={{
								width: '100%',
								padding: '10px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
							}}
						>
							<option value="preferred">Preferred (recommended)</option>
							<option value="required">Required (strict security)</option>
							<option value="discouraged">Discouraged (convenience)</option>
						</select>
					</div>

					<div style={{ marginBottom: '16px' }}>
						<label
							style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}
						>
							Authenticator Type
							<MFAInfoButtonV8 contentKey="fido2.authenticatorAttachment" displayMode="tooltip" />
						</label>
						<select
							value={deviceConfig.fido2Config.authenticatorAttachment}
							onChange={(e) =>
								setDeviceConfig({
									...deviceConfig,
									fido2Config: {
										...deviceConfig.fido2Config,
										authenticatorAttachment: e.target.value as 'platform' | 'cross-platform',
									},
								})
							}
							style={{
								width: '100%',
								padding: '10px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
							}}
						>
							<option value="cross-platform">Cross-platform (USB key, phone)</option>
							<option value="platform">Platform (Windows Hello, Touch ID)</option>
						</select>
					</div>
				</>
			)}

			{deviceType === 'TOTP' && (
				<>
					<div style={{ marginBottom: '16px' }}>
						<label
							style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}
						>
							QR Code Size
							<MFAInfoButtonV8 contentKey="totp.qrCodeSize" displayMode="tooltip" />
						</label>
						<select
							value={deviceConfig.totpConfig.qrCodeSize}
							onChange={(e) =>
								setDeviceConfig({
									...deviceConfig,
									totpConfig: {
										...deviceConfig.totpConfig,
										qrCodeSize: parseInt(e.target.value, 10),
									},
								})
							}
							style={{
								width: '100%',
								padding: '10px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
							}}
						>
							<option value="150">Small (150px)</option>
							<option value="200">Medium (200px)</option>
							<option value="250">Large (250px)</option>
							<option value="300">Extra Large (300px)</option>
						</select>
					</div>

					<div style={{ marginBottom: '16px' }}>
						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							<input
								type="checkbox"
								checked={deviceConfig.totpConfig.includeSecret}
								onChange={(e) =>
									setDeviceConfig({
										...deviceConfig,
										totpConfig: { ...deviceConfig.totpConfig, includeSecret: e.target.checked },
									})
								}
								style={{ width: '16px', height: '16px' }}
							/>
							Show secret key (for manual entry)
							<MFAInfoButtonV8 contentKey="totp.includeSecret" displayMode="tooltip" />
						</label>
					</div>
				</>
			)}

			<div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
				<button
					type="button"
					onClick={handleStartRegistration}
					disabled={isLoading}
					style={{
						flex: 1,
						padding: '12px 24px',
						backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
						color: 'white',
						border: 'none',
						borderRadius: '6px',
						fontSize: '16px',
						fontWeight: '600',
						cursor: isLoading ? 'not-allowed' : 'pointer',
					}}
				>
					{isLoading ? '🔄 Registering...' : `Register ${deviceType} Device`}
				</button>

				<button
					type="button"
					onClick={onCancel}
					disabled={isLoading}
					style={{
						padding: '12px 24px',
						backgroundColor: '#f3f4f6',
						color: '#374151',
						border: '1px solid #d1d5db',
						borderRadius: '6px',
						fontSize: '16px',
						fontWeight: '600',
						cursor: isLoading ? 'not-allowed' : 'pointer',
					}}
				>
					Cancel
				</button>
			</div>
		</div>
	);

	const renderVerificationStep = () => (
		<div style={{ padding: '20px', maxWidth: '500px' }}>
			<h2 style={{ marginBottom: '20px', color: '#1f2937' }}>
				{deviceType === 'FIDO2' ? 'FIDO2 Device Registered' : `Verify ${deviceType} Device`}
			</h2>

			{deviceType === 'FIDO2' && (
				<div
					style={{
						padding: '16px',
						backgroundColor: '#f0fdf4',
						border: '1px solid #22c55e',
						borderRadius: '6px',
						marginBottom: '20px',
					}}
				>
					<h3 style={{ margin: '0 0 8px 0', color: '#16a34a', fontSize: '16px' }}>
						FIDO2 Device Successfully Registered!
					</h3>
					<p style={{ margin: 0, color: '#15803d', fontSize: '14px' }}>
						Your FIDO2 security key has been registered and is ready to use. You can now use it for
						secure authentication.
					</p>
					{registrationResult?.fido2Result && (
						<div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
							<div>
								Credential ID: {registrationResult.fido2Result?.credentialId?.substring(0, 20)}...
							</div>
							<div>Status: {registrationResult.status}</div>
						</div>
					)}
				</div>
			)}

			{deviceType === 'TOTP' && registrationResult?.totpResult && (
				<div
					style={{
						padding: '16px',
						backgroundColor: '#f0f9ff',
						border: '1px solid #0ea5e9',
						borderRadius: '6px',
						marginBottom: '20px',
						textAlign: 'center',
					}}
				>
					<h3 style={{ margin: '0 0 12px 0', color: '#0c4a6e', fontSize: '16px' }}>
						Scan QR Code with Authenticator App
					</h3>

					{registrationResult.totpResult?.qrCode && (
						<div style={{ marginBottom: '16px' }}>
							<img
								src={registrationResult.totpResult.qrCode}
								alt="TOTP QR Code"
								style={{
									width: deviceConfig.totpConfig.qrCodeSize,
									height: deviceConfig.totpConfig.qrCodeSize,
									border: '1px solid #e2e8f0',
									borderRadius: '8px',
									backgroundColor: 'white',
								}}
							/>
						</div>
					)}

					{deviceConfig.totpConfig.includeSecret && registrationResult.totpResult.secret && (
						<div
							style={{
								padding: '12px',
								backgroundColor: '#f8fafc',
								border: '1px solid #e2e8f0',
								borderRadius: '6px',
								marginBottom: '16px',
							}}
						>
							<div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
								Secret Key (for manual entry):
							</div>
							<div
								style={{
									fontFamily: 'monospace',
									fontSize: '14px',
									color: '#1e293b',
									wordBreak: 'break-all',
									padding: '8px',
									backgroundColor: '#ffffff',
									border: '1px solid #cbd5e1',
									borderRadius: '4px',
								}}
							>
								{registrationResult.totpResult.secret}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Standard OTP verification for non-FIDO2 devices */}
			{deviceType !== 'FIDO2' && (
				<>
					<div
						style={{
							padding: '16px',
							backgroundColor: '#f0f9ff',
							border: '1px solid #0ea5e9',
							borderRadius: '6px',
							marginBottom: '20px',
						}}
					>
						<p style={{ margin: 0, color: '#0c4a6e', fontSize: '14px' }}>
							{registrationResult?.message ||
								'A verification code has been sent. Please enter it below to activate your device.'}
						</p>
					</div>

					{validationErrors.length > 0 && (
						<div
							style={{
								padding: '12px',
								backgroundColor: '#fef2f2',
								border: '1px solid #fecaca',
								borderRadius: '6px',
								marginBottom: '20px',
							}}
						>
							{validationErrors.map((error, index) => (
								<div
									key={index}
									style={{ color: '#dc2626', fontSize: '14px', marginBottom: '4px' }}
								>
									• {error}
								</div>
							))}
						</div>
					)}

					<div style={{ marginBottom: '16px' }}>
						<label
							style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}
						>
							<span>Verification Code</span>
							<MFAInfoButtonV8 contentKey="otp.code" displayMode="tooltip" />
						</label>
						<input
							type="text"
							value={otpCode}
							onChange={(e) => setOtpCode(e.target.value)}
							placeholder="Enter the verification code"
							maxLength={10}
							style={{
								width: '100%',
								padding: '10px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
							}}
						/>
					</div>

					<div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
						<button
							type="button"
							onClick={handleCompleteRegistration}
							disabled={isLoading || !otpCode.trim()}
							style={{
								flex: 1,
								padding: '12px 24px',
								backgroundColor: isLoading || !otpCode.trim() ? '#9ca3af' : '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '16px',
								fontWeight: '600',
								cursor: isLoading || !otpCode.trim() ? 'not-allowed' : 'pointer',
							}}
						>
							{isLoading ? '🔄 Verifying...' : 'Verify & Activate'}
						</button>

						<button
							type="button"
							onClick={onCancel}
							disabled={isLoading}
							style={{
								padding: '12px 24px',
								backgroundColor: '#f3f4f6',
								color: '#374151',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '16px',
								fontWeight: '600',
								cursor: isLoading ? 'not-allowed' : 'pointer',
							}}
						>
							Cancel
						</button>
					</div>
				</>
			)}

			{/* FIDO2 completion button */}
			{deviceType === 'FIDO2' && (
				<div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
					<button
						type="button"
						onClick={() => onComplete(registrationResult?.deviceId || '')}
						style={{
							flex: 1,
							padding: '12px 24px',
							backgroundColor: '#22c55e',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						Continue
					</button>

					<button
						type="button"
						onClick={onCancel}
						style={{
							padding: '12px 24px',
							backgroundColor: '#6b7280',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						Cancel
					</button>
				</div>
			)}
		</div>
	);

	const renderSuccessStep = () => (
		<div style={{ padding: '20px', maxWidth: '500px', textAlign: 'center' }}>
			<div
				style={{
					width: '80px',
					height: '80px',
					backgroundColor: '#10b981',
					borderRadius: '50%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					margin: '0 auto 20px',
				}}
			>
				<span style={{ color: 'white', fontSize: '40px' }}>✓</span>
			</div>

			<h2 style={{ marginBottom: '12px', color: '#1f2937' }}>Device Registered Successfully!</h2>

			<p style={{ marginBottom: '20px', color: '#6b7280', fontSize: '16px' }}>
				Your {deviceType} device has been registered and is ready to use.
			</p>

			{registrationResult && (
				<div
					style={{
						padding: '16px',
						backgroundColor: '#f9fafb',
						border: '1px solid #e5e7eb',
						borderRadius: '6px',
						marginBottom: '20px',
						textAlign: 'left',
					}}
				>
					<div style={{ marginBottom: '8px' }}>
						<strong>Device ID:</strong> {registrationResult.deviceId}
					</div>
					<div style={{ marginBottom: '8px' }}>
						<strong>Status:</strong> {registrationResult.status}
					</div>
					<div>
						<strong>Device Name:</strong> {deviceConfig.deviceName}
					</div>
				</div>
			)}

			<button
				type="button"
				onClick={() => onComplete(registrationResult?.deviceId || '')}
				style={{
					padding: '12px 24px',
					backgroundColor: '#3b82f6',
					color: 'white',
					border: 'none',
					borderRadius: '6px',
					fontSize: '16px',
					fontWeight: '600',
					cursor: 'pointer',
				}}
			>
				Continue
			</button>
		</div>
	);

	return (
		<div
			style={{
				backgroundColor: 'white',
				borderRadius: '8px',
				boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
			}}
		>
			{currentStep === 'configure' && renderConfigurationStep()}
			{currentStep === 'verify' && renderVerificationStep()}
			{currentStep === 'success' && renderSuccessStep()}
		</div>
	);
};

export default MFADeviceRegistrationV8;
