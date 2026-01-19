import React from 'react';
import { FiX, FiLoader, FiKey } from 'react-icons/fi';
import { PingIdentityLogo } from '@/v8/components/shared/PingIdentityLogo';

export interface MFAFIDO2ChallengeModalProps {
	show: boolean;
	onClose: () => void;
	onAuthenticate: () => Promise<void>;
	fido2Error: string | null;
	isAuthenticating: boolean;
	isWebAuthnSupported: boolean;
	hasChallengeData: boolean;
}

export const MFAFIDO2ChallengeModal: React.FC<MFAFIDO2ChallengeModalProps> = ({
	show,
	onClose,
	onAuthenticate,
	fido2Error,
	isAuthenticating,
	isWebAuthnSupported,
	hasChallengeData,
}) => {
	if (!show) return null;

	const isMac =
		typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

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
			onClick={onClose}
		>
			<div
				style={{
					background: 'white',
					borderRadius: '16px',
					padding: '0',
					maxWidth: '500px',
					width: '90%',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
					overflow: 'hidden',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header with Logo */}
				<div
					style={{
						background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
						padding: '32px 32px 24px 32px',
						textAlign: 'center',
						position: 'relative',
					}}
				>
					<button
						type="button"
						onClick={onClose}
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
						{isMac ? 'Use your Passkey' : 'Use your security key'}
					</h3>
				</div>
				<div style={{ padding: '32px' }}>
					<p
						style={{
							margin: '0 0 24px 0',
							color: '#6b7280',
							fontSize: '15px',
							lineHeight: '1.5',
							textAlign: 'center',
						}}
					>
						{isMac
							? 'Please use your Passkey (Touch ID or Face ID) to complete authentication.'
							: 'Please use your security key, Touch ID, Face ID, or Windows Hello to complete authentication.'}
					</p>

					{fido2Error && (
						<div
							style={{
								padding: '12px',
								background: '#fef2f2',
								border: '1px solid #fecaca',
								borderRadius: '6px',
								color: '#991b1b',
								fontSize: '14px',
								marginBottom: '16px',
							}}
						>
							{fido2Error}
						</div>
					)}

					{!isWebAuthnSupported && (
						<div
							style={{
								padding: '12px',
								background: '#fef2f2',
								border: '1px solid #fecaca',
								borderRadius: '6px',
								color: '#991b1b',
								fontSize: '14px',
								marginBottom: '16px',
							}}
						>
							WebAuthn is not supported in this browser. Please use a modern browser.
						</div>
					)}

					<div style={{ display: 'flex', gap: '12px' }}>
						<button
							type="button"
							onClick={onAuthenticate}
							disabled={isAuthenticating || !isWebAuthnSupported || !hasChallengeData}
							title={
								!hasChallengeData
									? 'WebAuthn challenge not found. Please try selecting the device again.'
									: !isWebAuthnSupported
										? 'WebAuthn is not supported in this browser'
										: isAuthenticating
											? 'Authenticating...'
											: 'Click to authenticate with your Passkey or security key'
							}
							style={{
								flex: 1,
								padding: '10px 24px',
								border: 'none',
								borderRadius: '6px',
								background:
									isAuthenticating || !hasChallengeData ? '#9ca3af' : '#3b82f6',
								color: 'white',
								fontSize: '16px',
								fontWeight: '600',
								cursor:
									isAuthenticating || !hasChallengeData
										? 'not-allowed'
										: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px',
								transition: 'background 0.2s ease',
							}}
						>
							{isAuthenticating ? (
								<>
									<FiLoader style={{ animation: 'spin 1s linear infinite' }} />
									Authenticating...
								</>
							) : (
								<>
									<FiKey />
									{isMac ? 'Authenticate with Passkey' : 'Authenticate with Security Key'}
								</>
							)}
						</button>
						<button
							type="button"
							onClick={onClose}
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
