// src/components/FIDO2RegistrationModal.tsx
// FIDO2/WebAuthn Passkey Registration Modal

import React, { useEffect, useState } from 'react';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { FIDO2Config, FIDO2Service } from '../services/fido2Service';

import { logger } from '../utils/logger';

interface FIDO2RegistrationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: (credentialId: string, publicKey: string) => void;
	userId: string;
	deviceName: string;
	rpId?: string;
	rpName?: string;
}

const FIDO2RegistrationModal: React.FC<FIDO2RegistrationModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	userId,
	deviceName,
	rpId = window.location.hostname,
	rpName = 'OAuth Playground',
}) => {
	const [isRegistering, setIsRegistering] = useState(false);
	const [capabilities, setCapabilities] = useState<ReturnType<
		typeof FIDO2Service.getCapabilities
	> | null>(null);
	const [selectedAuthenticatorType, setSelectedAuthenticatorType] = useState<
		'platform' | 'cross-platform' | 'any'
	>('any');
	const [error, setError] = useState<string | null>(null);

	// Check WebAuthn capabilities when modal opens
	useEffect(() => {
		if (isOpen) {
			const caps = FIDO2Service.getCapabilities();
			setCapabilities(caps);

			if (!caps.webAuthnSupported) {
				setError(
					'WebAuthn is not supported in this browser. Please use a modern browser that supports passkeys.'
				);
			} else {
				setError(null);
			}
		}
	}, [isOpen]);

	const handleRegisterCredential = async () => {
		if (!capabilities?.webAuthnSupported) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'WebAuthn is not supported in this browser',
				dismissible: true,
			});
			return;
		}

		setIsRegistering(true);
		setError(null);

		try {
			// Generate challenge
			const challenge = FIDO2Service.generateChallenge();

			// Create FIDO2 configuration
			const config: FIDO2Config = {
				rpId,
				rpName,
				userDisplayName: `${userId} (${deviceName})`,
				userName: userId,
				userHandle: userId,
				challenge,
				timeout: 60000,
				attestation: 'none',
				authenticatorSelection: {
					authenticatorAttachment:
						selectedAuthenticatorType === 'any' ? undefined : selectedAuthenticatorType,
					userVerification: 'preferred',
					residentKey: 'preferred',
				},
			};

			logger.info('🔐 [FIDO2 Registration] Starting credential registration', {
				userId,
				deviceName,
				authenticatorType: selectedAuthenticatorType,
			});

			// Register the credential
			const result = await FIDO2Service.registerCredential(config);

			if (result.success && result.credentialId) {
				logger.info('✅ [FIDO2 Registration] Credential registered successfully', 'Logger info');
				modernMessaging.showFooterMessage({
					type: 'status',
					message: 'Passkey registered successfully!',
					duration: 4000,
				});
				onSuccess(result.credentialId, result.publicKey || '');
			} else {
				throw new Error(result.error || 'Registration failed');
			}
		} catch (error: unknown) {
			logger.error(
				'FIDO2RegistrationModal',
				'❌ [FIDO2 Registration] Registration failed:',
				undefined,
				error as Error
			);
			const errorMessage = error instanceof Error ? error.message : 'Registration failed';
			setError(errorMessage);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: errorMessage,
				dismissible: true,
			});
		} finally {
			setIsRegistering(false);
		}
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
								backgroundColor: '#10b981',
								borderRadius: '0.5rem',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: 'white',
							}}
						>
							<span style={{ fontSize: '20px' }}>🛡️</span>
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
								Setup Passkey
							</h2>
							<p
								style={{
									margin: 0,
									fontSize: '0.875rem',
									color: '#6b7280',
								}}
							>
								Register a FIDO2 security key or built-in authenticator
							</p>
						</div>
					</div>
					<button
						type="button"
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
						<span style={{ fontSize: '20px' }}>❌</span>
					</button>
				</div>

				{/* Content */}
				{error ? (
					<div
						style={{
							padding: '1rem',
							backgroundColor: '#fef2f2',
							borderRadius: '0.5rem',
							border: '1px solid V9_COLORS.BG.ERROR_BORDER',
							marginBottom: '1.5rem',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								color: '#dc2626',
							}}
						>
							<span style={{ fontSize: '16px' }}>⚠️</span>
							<span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Error</span>
						</div>
						<p
							style={{
								margin: '0.5rem 0 0 0',
								fontSize: '0.875rem',
								color: '#dc2626',
							}}
						>
							{error}
						</p>
					</div>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
						{/* WebAuthn Support Check */}
						{capabilities && (
							<div
								style={{
									padding: '1rem',
									backgroundColor: capabilities.webAuthnSupported ? '#f0fdf4' : '#fef2f2',
									borderRadius: '0.5rem',
									border: `1px solid ${capabilities.webAuthnSupported ? '#86efac' : '#ef4444'}`,
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.5rem',
									}}
								>
									{capabilities.webAuthnSupported ? (
										<span style={{ fontSize: 16, color: '#059669' }}>✅</span>
									) : (
										<span style={{ fontSize: 16, color: '#dc2626' }}>⚠️</span>
									)}
									<span
										style={{
											fontSize: '0.875rem',
											fontWeight: 500,
											color: capabilities.webAuthnSupported ? '#059669' : '#dc2626',
										}}
									>
										WebAuthn Support
									</span>
								</div>
								<div
									style={{
										fontSize: '0.75rem',
										color: capabilities.webAuthnSupported ? '#059669' : '#dc2626',
										lineHeight: 1.5,
									}}
								>
									{capabilities.webAuthnSupported ? (
										<>
											<div>✅ WebAuthn is supported</div>
											{capabilities.platformAuthenticator && (
												<div>✅ Built-in authenticator available</div>
											)}
											{capabilities.crossPlatformAuthenticator && (
												<div>✅ External security keys supported</div>
											)}
										</>
									) : (
										<div>❌ WebAuthn is not supported in this browser</div>
									)}
								</div>
							</div>
						)}

						{/* Authenticator Type Selection */}
						{capabilities?.webAuthnSupported && (
							<div>
								<h4
									style={{
										margin: '0 0 1rem 0',
										fontSize: '0.875rem',
										fontWeight: 600,
										color: '#1f2937',
									}}
								>
									Choose Authenticator Type
								</h4>

								<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
									{/* Platform Authenticator */}
									{capabilities.platformAuthenticator && (
										<button
											type="button"
											onClick={() => setSelectedAuthenticatorType('platform')}
											onKeyDown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													setSelectedAuthenticatorType('platform');
												}
											}}
											aria-pressed={selectedAuthenticatorType === 'platform'}
											style={{
												padding: '1rem',
												border:
													selectedAuthenticatorType === 'platform'
														? '2px solid V9_COLORS.PRIMARY.BLUE'
														: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
												borderRadius: '0.5rem',
												cursor: 'pointer',
												backgroundColor:
													selectedAuthenticatorType === 'platform' ? '#f8fafc' : '#ffffff',
												transition: 'all 0.2s ease',
												width: '100%',
												textAlign: 'left',
											}}
										>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '0.75rem',
												}}
											>
												<span style={{ fontSize: 20, color: '#3b82f6' }}>🖥️</span>
												<div>
													<div
														style={{
															fontWeight: 600,
															fontSize: '0.875rem',
															color: '#1f2937',
														}}
													>
														Built-in Authenticator
													</div>
													<div
														style={{
															fontSize: '0.75rem',
															color: '#6b7280',
														}}
													>
														Touch ID, Face ID, Windows Hello, etc.
													</div>
												</div>
											</div>
										</button>
									)}

									{/* Cross-Platform Authenticator */}
									{capabilities.crossPlatformAuthenticator && (
										<button
											type="button"
											onClick={() => setSelectedAuthenticatorType('cross-platform')}
											onKeyDown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													setSelectedAuthenticatorType('cross-platform');
												}
											}}
											aria-pressed={selectedAuthenticatorType === 'cross-platform'}
											style={{
												padding: '1rem',
												border:
													selectedAuthenticatorType === 'cross-platform'
														? '2px solid V9_COLORS.PRIMARY.BLUE'
														: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
												borderRadius: '0.5rem',
												cursor: 'pointer',
												backgroundColor:
													selectedAuthenticatorType === 'cross-platform' ? '#f8fafc' : '#ffffff',
												transition: 'all 0.2s ease',
												width: '100%',
												textAlign: 'left',
											}}
										>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '0.75rem',
												}}
											>
												<span style={{ fontSize: 20, color: '#10b981' }}>🔑</span>
												<div>
													<div
														style={{
															fontWeight: 600,
															fontSize: '0.875rem',
															color: '#1f2937',
														}}
													>
														External Security Key
													</div>
													<div
														style={{
															fontSize: '0.75rem',
															color: '#6b7280',
														}}
													>
														YubiKey, FIDO2 security keys, etc.
													</div>
												</div>
											</div>
										</button>
									)}

									{/* Any Authenticator */}
									<button
										type="button"
										onClick={() => setSelectedAuthenticatorType('any')}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												setSelectedAuthenticatorType('any');
											}
										}}
										aria-pressed={selectedAuthenticatorType === 'any'}
										style={{
											padding: '1rem',
											border:
												selectedAuthenticatorType === 'any'
													? '2px solid V9_COLORS.PRIMARY.BLUE'
													: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
											borderRadius: '0.5rem',
											cursor: 'pointer',
											backgroundColor: selectedAuthenticatorType === 'any' ? '#f8fafc' : '#ffffff',
											transition: 'all 0.2s ease',
											width: '100%',
											textAlign: 'left',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.75rem',
											}}
										>
											<span style={{ fontSize: 20, color: '#6b7280' }}>🛡️</span>
											<div>
												<div
													style={{
														fontWeight: 600,
														fontSize: '0.875rem',
														color: '#1f2937',
													}}
												>
													Any Compatible Authenticator
												</div>
												<div
													style={{
														fontSize: '0.75rem',
														color: '#6b7280',
													}}
												>
													Let the browser choose the best option
												</div>
											</div>
										</div>
									</button>
								</div>
							</div>
						)}

						{/* Setup Instructions */}
						{selectedAuthenticatorType !== 'any' && (
							<div
								style={{
									padding: '1rem',
									backgroundColor: '#f8fafc',
									borderRadius: '0.5rem',
									border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
								}}
							>
								<h4
									style={{
										margin: '0 0 0.5rem 0',
										fontSize: '0.875rem',
										fontWeight: 600,
										color: '#3b82f6',
									}}
								>
									📋 Setup Instructions
								</h4>
								<ol
									style={{
										margin: 0,
										paddingLeft: '1.25rem',
										fontSize: '0.75rem',
										color: '#3b82f6',
										lineHeight: 1.5,
									}}
								>
									{FIDO2Service.getSetupInstructions(selectedAuthenticatorType).map(
										(instruction, index) => (
											<li key={index}>{instruction}</li>
										)
									)}
								</ol>
							</div>
						)}

						{/* Account Information */}
						<div
							style={{
								padding: '1rem',
								backgroundColor: '#fef3c7',
								borderRadius: '0.5rem',
								border: '1px solid V9_COLORS.PRIMARY.YELLOW',
							}}
						>
							<h4
								style={{
									margin: '0 0 0.5rem 0',
									fontSize: '0.875rem',
									fontWeight: 600,
									color: '#d97706',
								}}
							>
								📋 Account Information
							</h4>
							<div
								style={{
									fontSize: '0.75rem',
									color: '#d97706',
									lineHeight: 1.5,
								}}
							>
								<div>
									<strong>Relying Party:</strong> {rpName}
								</div>
								<div>
									<strong>Domain:</strong> {rpId}
								</div>
								<div>
									<strong>User:</strong> {userId}
								</div>
								<div>
									<strong>Device:</strong> {deviceName}
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
						borderTop: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
					}}
				>
					<button
						type="button"
						onClick={onClose}
						disabled={isRegistering}
						style={{
							padding: '0.75rem 1.5rem',
							border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							borderRadius: '0.375rem',
							backgroundColor: 'white',
							color: '#1f2937',
							fontSize: '0.875rem',
							fontWeight: '500',
							cursor: isRegistering ? 'not-allowed' : 'pointer',
							transition: 'all 0.2s ease',
							opacity: isRegistering ? 0.5 : 1,
						}}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleRegisterCredential}
						disabled={isRegistering || !capabilities?.webAuthnSupported || !!error}
						style={{
							padding: '0.75rem 1.5rem',
							border: 'none',
							borderRadius: '0.375rem',
							backgroundColor:
								isRegistering || !capabilities?.webAuthnSupported || !!error
									? '#9ca3af'
									: '#10b981',
							color: 'white',
							fontSize: '0.875rem',
							fontWeight: '600',
							cursor:
								isRegistering || !capabilities?.webAuthnSupported || !!error
									? 'not-allowed'
									: 'pointer',
							transition: 'all 0.2s ease',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}
					>
						{isRegistering ? (
							<>
								<div
									style={{
										width: '1rem',
										height: '1rem',
										border: '2px solid V9_COLORS.TEXT.WHITE',
										borderTop: '2px solid transparent',
										borderRadius: '50%',
										animation: 'spin 1s linear infinite',
									}}
								/>
								Registering...
							</>
						) : (
							<>
								<span style={{ fontSize: '16px' }}>🛡️</span>
								Register Passkey
							</>
						)}
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

export default FIDO2RegistrationModal;
