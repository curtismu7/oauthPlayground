import React from 'react';
import { FiX, FiLoader } from 'react-icons/fi';
import { PingIdentityLogo } from '@/v8/components/shared/PingIdentityLogo';
import { MFAOTPInput } from '../MFAOTPInput';

export interface MFAOTPInputModalProps {
	show: boolean;
	onClose: () => void;
	otpCode: string;
	setOtpCode: (code: string) => void;
	otpError: string | null;
	setOtpError: (error: string | null) => void;
	isValidatingOTP: boolean;
	onVerifyCode: () => Promise<void>;
	onResendCode: () => Promise<void>;
	selectedDeviceInfo?: {
		phone?: string;
		email?: string;
	} | null;
}

export const MFAOTPInputModal: React.FC<MFAOTPInputModalProps> = ({
	show,
	onClose,
	otpCode,
	setOtpCode,
	otpError,
	setOtpError,
	isValidatingOTP,
	onVerifyCode,
	onResendCode,
	selectedDeviceInfo,
}) => {
	if (!show) return null;

	const handleClose = () => {
		onClose();
		setOtpCode('');
		setOtpError(null);
	};

	return (
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
				zIndex: 1000,
			}}
			onClick={handleClose}
		>
			<div
				style={{
					background: 'white',
					borderRadius: '16px',
					padding: '0',
					maxWidth: '450px',
					width: '90%',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
					overflow: 'hidden',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header with Logo */}
				<div
					style={{
						background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
						padding: '32px 32px 24px 32px',
						textAlign: 'center',
						position: 'relative',
					}}
				>
					<button
						type="button"
						onClick={handleClose}
						style={{
							position: 'absolute',
							top: '16px',
							right: '16px',
							background: 'rgba(255, 255, 255, 0.2)',
							border: 'none',
							borderRadius: '50%',
							width: '32px',
							height: '32px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
							color: 'white',
						}}
					>
						<FiX size={18} />
					</button>
					<PingIdentityLogo size={48} />
					<h3
						style={{
							margin: '0',
							fontSize: '22px',
							fontWeight: '600',
							color: 'white',
							textAlign: 'center',
						}}
					>
						Enter verification code
					</h3>
				</div>
				<div style={{ padding: '32px', textAlign: 'center' }}>
					<p
						style={{
							margin: '0 0 8px 0',
							color: '#6b7280',
							fontSize: '15px',
							lineHeight: '1.5',
						}}
					>
						Enter the verification code sent to your device.
					</p>
					{selectedDeviceInfo && (selectedDeviceInfo.phone || selectedDeviceInfo.email) && (
						<p
							style={{
								margin: '0 0 16px 0',
								color: '#374151',
								fontSize: '14px',
								fontWeight: '500',
								lineHeight: '1.5',
							}}
						>
							{selectedDeviceInfo.phone
								? `📱 Phone: ${selectedDeviceInfo.phone}`
								: `📧 Email: ${selectedDeviceInfo.email}`}
						</p>
					)}

					{otpError && (
						<div
							style={{
								padding: '12px',
								background: '#fef2f2',
								border: '1px solid #fecaca',
								borderRadius: '6px',
								color: '#991b1b',
								fontSize: '14px',
								marginBottom: '16px',
								textAlign: 'center',
							}}
						>
							{otpError}
						</div>
					)}

					<div
						style={{
							marginBottom: '24px',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '16px',
						}}
					>
						<MFAOTPInput
							value={otpCode}
							onChange={(value) => {
								setOtpCode(value);
								setOtpError(null);
							}}
							disabled={isValidatingOTP}
							placeholder="123456"
							maxLength={6}
						/>
						{selectedDeviceInfo && (selectedDeviceInfo.phone || selectedDeviceInfo.email) && (
							<p
								style={{
									margin: '0',
									color: '#6b7280',
									fontSize: '14px',
									lineHeight: '1.5',
									textAlign: 'center',
									width: '100%',
								}}
							>
								Enter the 6-digit code from{' '}
								{selectedDeviceInfo.phone ? `your phone` : `your email`}
							</p>
						)}
					</div>

					<div style={{ display: 'flex', gap: '12px' }}>
						<button
							type="button"
							onClick={onVerifyCode}
							disabled={isValidatingOTP || otpCode.length !== 6}
							style={{
								flex: 1,
								padding: '10px 24px',
								border: 'none',
								borderRadius: '6px',
								background: isValidatingOTP || otpCode.length !== 6 ? '#9ca3af' : '#3b82f6',
								color: 'white',
								fontSize: '16px',
								fontWeight: '600',
								cursor: isValidatingOTP || otpCode.length !== 6 ? 'not-allowed' : 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px',
							}}
						>
							{isValidatingOTP ? (
								<>
									<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
									Validating...
								</>
							) : (
								'Verify Code'
							)}
						</button>
						<button
							type="button"
							onClick={onResendCode}
							disabled={isValidatingOTP}
							style={{
								padding: '10px 24px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								background: isValidatingOTP ? '#f3f4f6' : 'white',
								color: isValidatingOTP ? '#9ca3af' : '#374151',
								fontSize: '16px',
								fontWeight: '500',
								cursor: isValidatingOTP ? 'not-allowed' : 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px',
							}}
						>
							{isValidatingOTP ? (
								<>
									<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
									Sending...
								</>
							) : (
								<>🔄 Resend Code</>
							)}
						</button>
						<button
							type="button"
							onClick={handleClose}
							style={{
								padding: '10px 24px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								background: 'white',
								color: '#6b7280',
								fontSize: '16px',
								fontWeight: '500',
								cursor: 'pointer',
							}}
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
