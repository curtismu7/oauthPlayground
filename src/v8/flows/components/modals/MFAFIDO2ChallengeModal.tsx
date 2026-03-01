import { FiKey, FiX } from '@icons';
import React from 'react';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
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
					<ButtonSpinner
						loading={false}
						onClick={onClose}
						spinnerSize={12}
						spinnerPosition="left"
						loadingText="Closing..."
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
							padding: 0,
						}}
					>
						<FiX size={18} />
					</ButtonSpinner>
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
						<ButtonSpinner
							loading={isAuthenticating}
							onClick={onAuthenticate}
							disabled={isAuthenticating || !isWebAuthnSupported || !hasChallengeData}
							spinnerSize={16}
							spinnerPosition="left"
							loadingText="Authenticating..."
							style={{
								flex: 1,
								padding: '10px 24px',
								border: 'none',
								borderRadius: '6px',
								background: isAuthenticating || !hasChallengeData ? '#9ca3af' : '#3b82f6',
								color: 'white',
								fontSize: '16px',
								fontWeight: '600',
								cursor: isAuthenticating || !hasChallengeData ? 'not-allowed' : 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px',
								transition: 'background 0.2s ease',
							}}
						>
							{isAuthenticating ? (
								'Authenticating...'
							) : (
								<>
									<FiKey />
									{isMac ? 'Authenticate with Passkey' : 'Authenticate with Security Key'}
								</>
							)}
						</ButtonSpinner>
						<ButtonSpinner
							loading={false}
							onClick={onClose}
							spinnerSize={12}
							spinnerPosition="left"
							loadingText="Canceling..."
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
						</ButtonSpinner>
					</div>
				</div>
			</div>
		</div>
	);
};
