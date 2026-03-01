// src/components/TOTPQRCodeModal.tsx
// TOTP QR Code Modal for Authenticator App Setup

import { FiCheck, FiCopy, FiEye, FiEyeOff, FiKey, FiSmartphone, FiX } from '@icons';
import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useState } from 'react';
import { QRCodeService, TOTPConfig } from '../services/qrCodeService';
import { v4ToastManager } from '../utils/v4ToastMessages';

interface TOTPQRCodeModalProps {
	isOpen: boolean;
	onClose: () => void;
	onContinue: () => void;
	userId: string;
	deviceName: string;
	issuer?: string;
}

const TOTPQRCodeModal: React.FC<TOTPQRCodeModalProps> = ({
	isOpen,
	onClose,
	onContinue,
	userId,
	deviceName,
	issuer = 'PingOne',
}) => {
	const [totpConfig, setTotpConfig] = useState<TOTPConfig | null>(null);
	const [qrCodeData, setQrCodeData] = useState<string>('');
	const [manualEntryKey, setManualEntryKey] = useState<string>('');
	const [showSecret, setShowSecret] = useState(false);
	const [copied, setCopied] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	const generateTOTPConfig = React.useCallback(async () => {
		setIsGenerating(true);
		try {
			// Generate a secure TOTP secret
			const secret = QRCodeService.generateTOTPSecret(32);

			const config: TOTPConfig = {
				secret,
				issuer,
				accountName: `${userId}@${deviceName}`,
				algorithm: 'SHA1',
				digits: 6,
				period: 30,
			};

			// Generate QR code data
			const result = await QRCodeService.generateTOTPQRCode(config);

			setTotpConfig(config);
			setQrCodeData(result.totpUri);
			setManualEntryKey(result.manualEntryKey);

			console.log(`🔐 [TOTP QR Code] Generated TOTP configuration for ${config.accountName}`);
		} catch (error) {
			console.error('❌ [TOTP QR Code] Failed to generate TOTP config:', error);
			v4ToastManager.showError('Failed to generate TOTP configuration');
		} finally {
			setIsGenerating(false);
		}
	}, [issuer, userId, deviceName]);

	// Generate TOTP configuration when modal opens
	useEffect(() => {
		if (isOpen && !totpConfig) {
			generateTOTPConfig();
		}
	}, [isOpen, totpConfig, generateTOTPConfig]);

	const handleCopySecret = async () => {
		if (!totpConfig?.secret) return;

		try {
			await navigator.clipboard.writeText(totpConfig.secret);
			setCopied(true);
			v4ToastManager.showSuccess('Secret key copied to clipboard');

			// Reset copied state after 2 seconds
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('❌ [TOTP QR Code] Failed to copy secret:', error);
			v4ToastManager.showError('Failed to copy secret key');
		}
	};

	const handleContinue = () => {
		// Store the TOTP configuration for later use
		if (totpConfig) {
			sessionStorage.setItem('totpConfig', JSON.stringify(totpConfig));
		}
		onContinue();
	};

	if (!isOpen) return null;

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.5)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 1000,
				padding: '1rem',
			}}
		>
			<div
				style={{
					backgroundColor: 'white',
					borderRadius: '1rem',
					padding: '2rem',
					maxWidth: '500px',
					width: '100%',
					maxHeight: '90vh',
					overflow: 'auto',
					boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
				}}
			>
				{/* Header */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: '1.5rem',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.75rem',
						}}
					>
						<div
							style={{
								width: '2.5rem',
								height: '2.5rem',
								backgroundColor: '#3b82f6',
								borderRadius: '0.5rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: 'white',
							}}
						>
							<FiSmartphone size={20} />
						</div>
						<div>
							<h2
								style={{
									margin: 0,
									fontSize: '1.25rem',
									fontWeight: 600,
									color: '#1f2937',
								}}
							>
								Setup Authenticator App
							</h2>
							<p
								style={{
									margin: 0,
									fontSize: '0.875rem',
									color: '#6b7280',
								}}
							>
								Scan QR code or enter secret manually
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							padding: '0.5rem',
							borderRadius: '0.375rem',
							cursor: 'pointer',
							color: '#6b7280',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<FiX size={20} />
					</button>
				</div>

				{/* Content */}
				{isGenerating ? (
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '1rem',
							padding: '2rem',
						}}
					>
						<div
							style={{
								width: '3rem',
								height: '3rem',
								border: '3px solid #e5e7eb',
								borderTop: '3px solid #3b82f6',
								borderRadius: '50%',
								animation: 'spin 1s linear infinite',
							}}
						/>
						<p
							style={{
								margin: 0,
								color: '#6b7280',
								fontSize: '0.875rem',
							}}
						>
							Generating TOTP configuration...
						</p>
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
						{/* Instructions */}
						<div
							style={{
								padding: '1rem',
								backgroundColor: '#f0f9ff',
								borderRadius: '0.5rem',
								border: '1px solid #bae6fd',
							}}
						>
							<h3
								style={{
									margin: '0 0 0.5rem 0',
									fontSize: '0.875rem',
									fontWeight: 600,
									color: '#0369a1',
								}}
							>
								📱 Setup Instructions
							</h3>
							<ol
								style={{
									margin: 0,
									paddingLeft: '1.25rem',
									fontSize: '0.875rem',
									color: '#0369a1',
									lineHeight: 1.5,
								}}
							>
								<li>
									Install an authenticator app (Google Authenticator, Authy, Microsoft
									Authenticator)
								</li>
								<li>Scan the QR code below or enter the secret key manually</li>
								<li>Enter the 6-digit code from your app to verify</li>
							</ol>
						</div>

						{/* QR Code */}
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: '1rem',
							}}
						>
							<div
								style={{
									padding: '1rem',
									backgroundColor: 'white',
									borderRadius: '0.5rem',
									border: '1px solid #e5e7eb',
									boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
								}}
							>
								{qrCodeData && (
									<QRCodeSVG value={qrCodeData} size={200} level="M" includeMargin={true} />
								)}
							</div>
							<p
								style={{
									margin: 0,
									fontSize: '0.75rem',
									color: '#6b7280',
									textAlign: 'center',
								}}
							>
								Scan this QR code with your authenticator app
							</p>
						</div>

						{/* Manual Entry */}
						<div
							style={{
								padding: '1rem',
								backgroundColor: '#f9fafb',
								borderRadius: '0.5rem',
								border: '1px solid #e5e7eb',
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: '0.75rem',
								}}
							>
								<h4
									style={{
										margin: 0,
										fontSize: '0.875rem',
										fontWeight: 600,
										color: '#374151',
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
									}}
								>
									<FiKey size={16} />
									Manual Entry (Alternative)
								</h4>
								<button
									onClick={() => setShowSecret(!showSecret)}
									style={{
										background: 'none',
										border: 'none',
										padding: '0.25rem',
										borderRadius: '0.25rem',
										cursor: 'pointer',
										color: '#6b7280',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									{showSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
								</button>
							</div>

							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									padding: '0.75rem',
									backgroundColor: 'white',
									borderRadius: '0.375rem',
									border: '1px solid #d1d5db',
								}}
							>
								<code
									style={{
										flex: 1,
										fontSize: '0.875rem',
										fontFamily: 'monospace',
										color: showSecret ? '#1f2937' : '#6b7280',
										backgroundColor: 'transparent',
										border: 'none',
										outline: 'none',
										wordBreak: 'break-all',
									}}
								>
									{showSecret ? manualEntryKey : '•••• •••• •••• •••• •••• •••• •••• ••••'}
								</code>
								<button
									onClick={handleCopySecret}
									style={{
										background: copied ? '#10b981' : '#f3f4f6',
										border: 'none',
										padding: '0.5rem',
										borderRadius: '0.375rem',
										cursor: 'pointer',
										color: copied ? 'white' : '#6b7280',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										transition: 'all 0.2s ease',
									}}
								>
									{copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
								</button>
							</div>

							<p
								style={{
									margin: '0.5rem 0 0 0',
									fontSize: '0.75rem',
									color: '#6b7280',
								}}
							>
								If you can't scan the QR code, enter this secret key manually in your authenticator
								app
							</p>
						</div>

						{/* Account Information */}
						<div
							style={{
								padding: '1rem',
								backgroundColor: '#fef3c7',
								borderRadius: '0.5rem',
								border: '1px solid #f59e0b',
							}}
						>
							<h4
								style={{
									margin: '0 0 0.5rem 0',
									fontSize: '0.875rem',
									fontWeight: 600,
									color: '#92400e',
								}}
							>
								📋 Account Information
							</h4>
							<div
								style={{
									fontSize: '0.75rem',
									color: '#92400e',
									lineHeight: 1.5,
								}}
							>
								<div>
									<strong>Issuer:</strong> {issuer}
								</div>
								<div>
									<strong>Account:</strong> {userId}@{deviceName}
								</div>
								<div>
									<strong>Algorithm:</strong> SHA1
								</div>
								<div>
									<strong>Digits:</strong> 6
								</div>
								<div>
									<strong>Period:</strong> 30 seconds
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Footer */}
				<div
					style={{
						display: 'flex',
						gap: '0.75rem',
						justifyContent: 'flex-end',
						marginTop: '2rem',
						paddingTop: '1.5rem',
						borderTop: '1px solid #e5e7eb',
					}}
				>
					<button
						onClick={onClose}
						style={{
							padding: '0.75rem 1.5rem',
							border: '1px solid #d1d5db',
							borderRadius: '0.375rem',
							backgroundColor: 'white',
							color: '#374151',
							fontSize: '0.875rem',
							fontWeight: '500',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
						}}
					>
						Cancel
					</button>
					<button
						onClick={handleContinue}
						disabled={isGenerating}
						style={{
							padding: '0.75rem 1.5rem',
							border: 'none',
							borderRadius: '0.375rem',
							backgroundColor: isGenerating ? '#9ca3af' : '#3b82f6',
							color: 'white',
							fontSize: '0.875rem',
							fontWeight: '600',
							cursor: isGenerating ? 'not-allowed' : 'pointer',
							transition: 'all 0.2s ease',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}
					>
						Continue to Verification
					</button>
				</div>
			</div>

			{/* CSS for spinner animation */}
			<style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
		</div>
	);
};

export default TOTPQRCodeModal;
