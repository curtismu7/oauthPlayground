/**
 * @file MFAConfigurationStepV8.tsx
 * @module v8/flows/shared
 * @description Shared Step 0 configuration component for SMS, Email, TOTP flows
 * @version 8.3.0
 * 
 * Per rightTOTP.md: Dynamic screens to handle SMS, Email, TOTP use cases
 * - Ask for username
 * - Ask for User token (access token from Authorization Code Flow) OR Worker token (active or "ACTIVATION_REQUIRED")
 */

import React, { useState } from 'react';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import type { DeviceType, MFACredentials, TokenType, DeviceAuthenticationPolicy } from './MFATypes';
import type { MFAFlowBaseRenderProps } from './MFAFlowBaseV8';

interface MFAConfigurationStepV8Props extends MFAFlowBaseRenderProps {
	deviceType: DeviceType;
	deviceTypeLabel: string; // "SMS", "Email", "TOTP", etc.
	policyDescription?: string; // Custom description for device authentication policy
	registrationFlowType?: 'admin' | 'user'; // Registration flow type to control login button visibility
}

export const MFAConfigurationStepV8: React.FC<MFAConfigurationStepV8Props> = ({
	credentials,
	setCredentials,
	tokenStatus,
	deviceAuthPolicies,
	isLoadingPolicies,
	policiesError,
	refreshDeviceAuthPolicies,
	showWorkerTokenModal,
	setShowWorkerTokenModal,
	showUserLoginModal,
	setShowUserLoginModal,
	showSettingsModal,
	setShowSettingsModal,
	deviceType,
	deviceTypeLabel,
	policyDescription,
	registrationFlowType,
}) => {
	// Initialize tokenType from credentials, defaulting to 'worker' if not set
	// Use a function to ensure we only read credentials.tokenType once on mount
	const [tokenType, setTokenType] = useState<TokenType>(() => {
		const initialType = credentials.tokenType || 'worker';
		console.log(`[⚙️ MFA-CONFIG-STEP-V8] Initializing tokenType:`, { 
			fromCredentials: credentials.tokenType, 
			initialType 
		});
		return initialType;
	});
	
	// Validate initial userToken if present (using same logic as validateUserToken)
	const initialUserToken = credentials.userToken || '';
	const initialUserTokenStatus = initialUserToken 
		? (() => {
			if (!initialUserToken.trim()) {
				return 'invalid' as const;
			}
			
			const trimmedToken = initialUserToken.trim();
			// Remove any whitespace or newlines that might have been introduced
			const cleanToken = trimmedToken.replace(/\s+/g, '');
			
			// Basic JWT format check (3 parts separated by dots)
			const parts = cleanToken.split('.');
			if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
				return 'invalid' as const;
			}
			
			// Try to decode payload to check expiration
			try {
				// Base64url decode the payload
				const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
				// Add padding if needed
				const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
				const payloadJson = atob(paddedPayload);
				const payload = JSON.parse(payloadJson);
				const now = Math.floor(Date.now() / 1000);
				const exp = payload.exp;
				
				if (exp && exp > now) {
					return 'active' as const;
				} else if (exp && exp <= now) {
					return 'activation_required' as const;
				} else {
					return 'active' as const;
				}
			} catch {
				return 'invalid' as const;
			}
		})()
		: 'invalid' as const;
	
	const [userToken, setUserToken] = useState<string>(initialUserToken);
	const [userTokenStatus, setUserTokenStatus] = useState<'active' | 'activation_required' | 'invalid'>(initialUserTokenStatus);

	// Ref to prevent infinite loops between credentials updates and local state sync
	const isUpdatingCredentialsRef = React.useRef(false);

	// Validate user token format (basic JWT check) - defined early so it can be used in useEffects
	const validateUserToken = React.useCallback((token: string): 'active' | 'activation_required' | 'invalid' => {
		if (!token || !token.trim()) {
			return 'invalid';
		}

		const trimmedToken = token.trim();
		
		// Remove any whitespace or newlines that might have been introduced
		const cleanToken = trimmedToken.replace(/\s+/g, '');

		// Basic JWT format check (3 parts separated by dots)
		const parts = cleanToken.split('.');
		if (parts.length !== 3) {
			console.log(`[⚙️ MFA-CONFIG-STEP-V8] Token validation failed: expected 3 parts, got ${parts.length}`, {
				tokenLength: cleanToken.length,
				tokenPreview: cleanToken.substring(0, 50) + '...',
			});
			return 'invalid';
		}

		// Check that each part is not empty
		if (!parts[0] || !parts[1] || !parts[2]) {
			console.log(`[⚙️ MFA-CONFIG-STEP-V8] Token validation failed: empty parts`, {
				hasHeader: !!parts[0],
				hasPayload: !!parts[1],
				hasSignature: !!parts[2],
			});
			return 'invalid';
		}

		// Try to decode payload to check expiration
		try {
			// Base64url decode the payload
			const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
			// Add padding if needed
			const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
			const payloadJson = atob(paddedPayload);
			const payload = JSON.parse(payloadJson);
			const now = Math.floor(Date.now() / 1000);
			const exp = payload.exp;

			if (exp && exp > now) {
				// Token is valid and not expired
				return 'active';
			} else if (exp && exp <= now) {
				// Token is expired
				return 'activation_required';
			} else {
				// No expiration claim, assume active
				return 'active';
			}
		} catch (error) {
			// Invalid JWT format
			console.error(`[⚙️ MFA-CONFIG-STEP-V8] Token validation error:`, error, {
				tokenLength: cleanToken.length,
				tokenPreview: cleanToken.substring(0, 50) + '...',
			});
			return 'invalid';
		}
	}, []);

	// Sync tokenType when credentials.tokenType changes (but only if not currently updating)
	React.useEffect(() => {
		// Skip if we're in the middle of updating credentials (prevents loops)
		if (isUpdatingCredentialsRef.current) {
			return;
		}
		
		// CRITICAL: When Admin Flow is selected (registrationFlowType === 'admin'), 
		// tokenType MUST be 'worker' - sync immediately
		if (registrationFlowType === 'admin' && tokenType !== 'worker') {
			console.log(`[⚙️ MFA-CONFIG-STEP-V8] Admin Flow selected - forcing tokenType to 'worker'`, { 
				currentTokenType: tokenType,
				credentialsTokenType: credentials.tokenType,
			});
			setTokenType('worker');
			// Also ensure credentials.tokenType is 'worker'
			if (credentials.tokenType !== 'worker') {
				setCredentials((prev) => ({ ...prev, tokenType: 'worker', userToken: undefined }));
			}
			return;
		}
		
		// CRITICAL: When User Flow is selected (registrationFlowType === 'user'), 
		// tokenType MUST be 'user' - sync immediately
		if (registrationFlowType === 'user' && tokenType !== 'user') {
			console.log(`[⚙️ MFA-CONFIG-STEP-V8] User Flow selected - forcing tokenType to 'user'`, { 
				currentTokenType: tokenType,
				credentialsTokenType: credentials.tokenType,
			});
			setTokenType('user');
			// Also ensure credentials.tokenType is 'user'
			if (credentials.tokenType !== 'user') {
				setCredentials((prev) => ({ ...prev, tokenType: 'user' }));
			}
			return;
		}
		
		// Normal sync: update local tokenType when credentials.tokenType changes
		if (credentials.tokenType && credentials.tokenType !== tokenType) {
			console.log(`[⚙️ MFA-CONFIG-STEP-V8] Syncing tokenType from credentials`, { 
				from: tokenType, 
				to: credentials.tokenType 
			});
			setTokenType(credentials.tokenType);
		}
	}, [credentials.tokenType, tokenType, registrationFlowType, setCredentials]);

	// Sync userToken state when credentials.userToken changes (e.g., from UserLoginModal)
	React.useEffect(() => {
		// CRITICAL: If credentials has a userToken and tokenType is 'user', ensure local tokenType is also 'user'
		// This prevents the token from being cleared when the other useEffect runs
		if (credentials.userToken && credentials.tokenType === 'user' && tokenType !== 'user') {
			console.log(`[⚙️ MFA-CONFIG-STEP-V8] Token received - syncing tokenType to 'user' first`);
			setTokenType('user');
		}
		
		// Handle both cases: token added or token removed
		if (credentials.userToken !== userToken) {
			if (credentials.userToken) {
				console.log(`[⚙️ MFA-CONFIG-STEP-V8] Syncing userToken from credentials`, { 
					hasToken: !!credentials.userToken,
					tokenLength: credentials.userToken.length,
					tokenPreview: credentials.userToken.substring(0, 20) + '...'
				});
				setUserToken(credentials.userToken);
				const status = validateUserToken(credentials.userToken);
				setUserTokenStatus(status);
				console.log(`[⚙️ MFA-CONFIG-STEP-V8] User token validated`, { status, tokenLength: credentials.userToken.length });
			} else if (!credentials.userToken && userToken) {
				// CRITICAL: Don't clear token if modal is open, if we're switching to user flow, or if tokenType is 'user'
				// This prevents losing the token when the modal opens or during flow type changes
				const shouldPreserveToken = showUserLoginModal || 
					tokenType === 'user' ||
					credentials.tokenType === 'user' ||
					isUpdatingCredentialsRef.current;
				
				if (shouldPreserveToken) {
					console.log(`[⚙️ MFA-CONFIG-STEP-V8] ⚠️ Preserving userToken - preventing token loss`, {
						showUserLoginModal,
						tokenType,
						credentialsTokenType: credentials.tokenType,
						isUpdating: isUpdatingCredentialsRef.current,
						hasLocalToken: !!userToken,
						localTokenLength: userToken.length,
					});
					// Don't clear - token might be getting auto-populated or modal is handling it
					// Instead, wait a bit and check if credentials gets updated
					setTimeout(() => {
						if (!credentials.userToken && userToken && tokenType === 'user') {
							// If after delay still no token in credentials but we have one locally, restore it
							console.log(`[⚙️ MFA-CONFIG-STEP-V8] 🔄 Restoring userToken to credentials after delay`);
							setCredentials((prev) => ({
								...prev,
								userToken: userToken,
								tokenType: 'user' as const,
							}));
						}
					}, 500);
					return;
				}
				
				// Token was cleared
				console.log(`[⚙️ MFA-CONFIG-STEP-V8] User token cleared`);
				setUserToken('');
				setUserTokenStatus('invalid');
			}
		} else if (credentials.userToken && userTokenStatus === 'invalid') {
			// Token exists but status is invalid - re-validate
			console.log(`[⚙️ MFA-CONFIG-STEP-V8] Re-validating existing user token`);
			const status = validateUserToken(credentials.userToken);
			setUserTokenStatus(status);
			console.log(`[⚙️ MFA-CONFIG-STEP-V8] Re-validation result`, { status, tokenLength: credentials.userToken.length });
		}
	}, [credentials.userToken, credentials.tokenType, userToken, userTokenStatus, tokenType, validateUserToken]);

	// Update credentials when token type or user token changes
	// Only depend on local state (tokenType, userToken) to prevent loops
	React.useEffect(() => {
		// Skip if we're already updating (prevents loops)
		if (isUpdatingCredentialsRef.current) {
			return;
		}
		
		// Only update if credentials.tokenType doesn't match our local tokenType
		if (credentials.tokenType !== tokenType) {
			isUpdatingCredentialsRef.current = true;
			console.log(`[⚙️ MFA-CONFIG-STEP-V8] Syncing credentials.tokenType to match local tokenType`, {
				credentialsTokenType: credentials.tokenType,
				localTokenType: tokenType,
			});
			setCredentials((prev) => {
				// Only update if actually different to prevent unnecessary re-renders
				if (prev.tokenType === tokenType && prev.userToken === (tokenType === 'user' ? userToken : undefined)) {
					return prev;
				}
				// IMPORTANT: Don't clear userToken if credentials already has a userToken and we're switching to worker
				// This prevents clearing a token that was just received from UserLoginModal
				const shouldPreserveUserToken = prev.tokenType === 'user' && prev.userToken && tokenType === 'worker';
				return {
					...prev,
					tokenType,
					// Only clear userToken if switching to worker AND there's no existing userToken to preserve
					userToken: tokenType === 'user' 
						? (userToken || prev.userToken) // Preserve existing token if local userToken is empty
						: (shouldPreserveUserToken ? prev.userToken : undefined),
				};
			});
			// Reset flag after state update
			setTimeout(() => {
				isUpdatingCredentialsRef.current = false;
			}, 0);
		} else if (tokenType === 'user' && credentials.userToken !== userToken && userToken) {
			// Only update userToken if tokenType is 'user' and it changed and has a value
			isUpdatingCredentialsRef.current = true;
			setCredentials((prev) => {
				// Only update if actually different
				if (prev.userToken === userToken) {
					return prev;
				}
				return {
					...prev,
					userToken: userToken || undefined,
				};
			});
			// Reset flag after state update
			setTimeout(() => {
				isUpdatingCredentialsRef.current = false;
			}, 0);
		} else if (credentials.tokenType === 'user' && credentials.userToken && !userToken) {
			// CRITICAL: If credentials has a userToken but local state doesn't, sync it
			// This handles the case where token is received from UserLoginModal before local state updates
			console.log(`[⚙️ MFA-CONFIG-STEP-V8] Syncing userToken from credentials (token received externally)`, {
				credentialsUserToken: credentials.userToken?.substring(0, 20) + '...',
			});
			setUserToken(credentials.userToken);
			const status = validateUserToken(credentials.userToken);
			setUserTokenStatus(status);
		}
		// Only depend on local state, not credentials properties (prevents loops)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tokenType, userToken, setCredentials, credentials.tokenType, credentials.userToken, validateUserToken]);

	// Run validation on mount if token exists
	React.useEffect(() => {
		if (userToken && userTokenStatus === 'invalid') {
			console.log(`[⚙️ MFA-CONFIG-STEP-V8] Running initial validation on mount for existing token`);
			const status = validateUserToken(userToken);
			setUserTokenStatus(status);
			console.log(`[⚙️ MFA-CONFIG-STEP-V8] Initial validation result`, { status, tokenLength: userToken.length });
		}
	}, []); // Only run on mount

	const handleUserTokenChange = (value: string) => {
		setUserToken(value);
		const status = validateUserToken(value);
		setUserTokenStatus(status);

		if (status === 'invalid' && value.trim()) {
			// Don't show error immediately, let user finish typing
		}
	};

	// Get worker token status display
	const getWorkerTokenStatusDisplay = () => {
		return {
			icon: WorkerTokenStatusServiceV8.getStatusIcon(tokenStatus.status),
			message: tokenStatus.message,
			color: WorkerTokenStatusServiceV8.getStatusColor(tokenStatus.status),
			background: tokenStatus.isValid
				? tokenStatus.status === 'expiring-soon'
					? '#fef3c7'
					: '#d1fae5'
				: '#fee2e2',
			textColor: tokenStatus.isValid
				? tokenStatus.status === 'expiring-soon'
					? '#92400e'
					: '#065f46'
				: '#991b1b',
		};
	};

	// Get user token status display
	const getUserTokenStatusDisplay = () => {
		return {
			icon: userTokenStatus === 'active' ? '✅' : userTokenStatus === 'activation_required' ? '⚠️' : '❌',
			message:
				userTokenStatus === 'active'
					? 'User token is valid and active'
					: userTokenStatus === 'activation_required'
						? 'User token is expired or requires activation'
						: userTokenStatus === 'invalid'
							? 'User token is invalid or missing'
							: 'User token status unknown',
			color: userTokenStatus === 'active' ? '#10b981' : userTokenStatus === 'activation_required' ? '#f59e0b' : '#ef4444',
			background: userTokenStatus === 'active' ? '#d1fae5' : userTokenStatus === 'activation_required' ? '#fef3c7' : '#fee2e2',
			textColor: userTokenStatus === 'active' ? '#065f46' : userTokenStatus === 'activation_required' ? '#92400e' : '#991b1b',
		};
	};

	const workerTokenStatusDisplay = getWorkerTokenStatusDisplay();
	const userTokenStatusDisplay = getUserTokenStatusDisplay();
	const isTokenValid = tokenType === 'worker' ? tokenStatus.isValid : userTokenStatus === 'active';
	
	// Determine if login button should be visible
	// Show when registrationFlowType is 'user' (or when not provided and tokenType is 'user' for backward compatibility)
	const shouldShowLoginButton = registrationFlowType === 'user' || (registrationFlowType === undefined && tokenType === 'user');

	// Debug: Log when component renders
	React.useEffect(() => {
		console.log(`[⚙️ MFA-CONFIG-STEP-V8] Rendering configuration step for ${deviceTypeLabel}`, {
			tokenType,
			hasUserToken: !!userToken,
			hasWorkerToken: tokenStatus.isValid,
			hasEnvironmentId: !!credentials.environmentId,
			hasUsername: !!credentials.username,
			hasPolicy: !!credentials.deviceAuthenticationPolicyId,
		});
	}, [deviceTypeLabel, tokenType, userToken, tokenStatus.isValid, credentials.environmentId, credentials.username, credentials.deviceAuthenticationPolicyId]);

	return (
		<div className="step-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
			<div style={{ marginBottom: '32px' }}>
				<h2 style={{ 
					margin: '0 0 8px 0', 
					fontSize: '24px', 
					fontWeight: '700', 
					color: '#111827',
					display: 'flex',
					alignItems: 'center',
					gap: '12px'
				}}>
					Configure {deviceTypeLabel} MFA Settings
					<MFAInfoButtonV8 contentKey="device.enrollment" displayMode="modal" />
				</h2>
			<p style={{ 
				margin: 0, 
				fontSize: '15px', 
				color: '#6b7280',
				lineHeight: '1.5'
			}}>
				Enter your PingOne environment details and user information
			</p>
		</div>
		
		{/* Remove debug indicator - keeping for now but can be removed later */}

		{/* Flow Type Information */}
		<div style={{ 
				marginBottom: '28px',
				padding: '20px',
				background: '#f0f9ff',
				borderRadius: '8px',
				border: '1px solid #bae6fd',
			}}>
				<h3 style={{ 
					margin: '0 0 12px 0', 
					fontSize: '16px', 
					fontWeight: '600', 
					color: '#1e40af' 
				}}>
					Admin Flow vs User Flow
				</h3>
				<div style={{ fontSize: '14px', color: '#1e3a8a', lineHeight: '1.6' }}>
					<p style={{ margin: '0 0 12px 0' }}>
						<strong>Admin Flow:</strong> Uses a <strong>Worker Token</strong> (service account token) for administrative operations. 
						This flow allows you to choose the device status when registering:
					</p>
					<ul style={{ margin: '0 0 12px 0', paddingLeft: '20px' }}>
						<li><strong>ACTIVE:</strong> Device is immediately ready for use</li>
						<li><strong>ACTIVATION_REQUIRED:</strong> Device requires user verification (OTP) before it can be used</li>
					</ul>
					<p style={{ margin: '0' }}>
						<strong>User Flow:</strong> Uses a <strong>User Token</strong> (access token from OAuth Authorization Code Flow) 
						for user-initiated device registration. Devices are always created with <strong>ACTIVATION_REQUIRED</strong> status, 
						requiring the user to verify ownership via OTP before the device can be used for authentication.
					</p>
				</div>
			</div>

			{/* Token Status/Management */}
			<div style={{ 
				marginBottom: '28px',
				padding: '20px',
				background: '#ffffff',
				borderRadius: '8px',
				border: '1px solid #e5e7eb',
				boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
			}}>
				<div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
					{/* Worker Token Button - Always show, but optional when using User Token */}
					{tokenType === 'worker' ? (
						<button
							type="button"
							onClick={() => {
								if (tokenStatus.isValid) {
									import('@/v8/services/workerTokenServiceV8').then(({ workerTokenServiceV8 }) => {
										workerTokenServiceV8.clearToken();
										window.dispatchEvent(new Event('workerTokenUpdated'));
										WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
										toastV8.success('Worker token removed');
									});
								} else {
									setShowWorkerTokenModal(true);
								}
							}}
							className="token-button"
							style={{
								padding: '12px 20px',
								background: tokenStatus.isValid ? '#10b981' : '#ef4444',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								boxShadow: tokenStatus.isValid 
									? '0 2px 4px rgba(16, 185, 129, 0.2)' 
									: '0 2px 4px rgba(239, 68, 68, 0.2)',
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.transform = 'translateY(-1px)';
								e.currentTarget.style.boxShadow = tokenStatus.isValid 
									? '0 4px 8px rgba(16, 185, 129, 0.3)' 
									: '0 4px 8px rgba(239, 68, 68, 0.3)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = tokenStatus.isValid 
									? '0 2px 4px rgba(16, 185, 129, 0.2)' 
									: '0 2px 4px rgba(239, 68, 68, 0.2)';
							}}
						>
							<span>🔑</span>
							<span>{tokenStatus.isValid ? 'Manage Token' : 'Add Token'}</span>
						</button>
					) : (
						<div style={{ flex: 1, minWidth: '300px' }}>
							<label
								htmlFor="mfa-user-token"
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '8px',
								}}
							>
								User Token (Access Token) <span style={{ color: '#dc2626' }}>*</span>
								{userToken && (
									<span style={{ 
										marginLeft: '8px', 
										fontSize: '12px', 
										fontWeight: '400', 
										color: '#10b981' 
									}}>
										✓ Automatically obtained
									</span>
								)}
							</label>
							{userToken && userTokenStatus === 'active' ? (
								<>
									<div style={{
										width: '100%',
										padding: '12px 14px',
										border: '1px solid #10b981',
										borderRadius: '6px',
										fontSize: '12px',
										fontFamily: 'monospace',
										marginBottom: '10px',
										background: '#f0fdf4',
										color: '#065f46',
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
									}}>
										<span style={{ fontSize: '16px' }}>✓</span>
										<span style={{ flex: 1, wordBreak: 'break-all' }}>{userToken.substring(0, 50)}...</span>
										<button
											type="button"
											onClick={() => {
												setUserToken('');
												setUserTokenStatus('invalid');
												setCredentials((prev) => ({ ...prev, userToken: undefined }));
											}}
											style={{
												padding: '4px 8px',
												background: 'transparent',
												border: '1px solid #10b981',
												borderRadius: '4px',
												fontSize: '11px',
												color: '#065f46',
												cursor: 'pointer',
											}}
											title="Clear token and login again"
										>
											Clear
										</button>
									</div>
									{shouldShowLoginButton && (
										<button
											type="button"
											onClick={() => setShowUserLoginModal(true)}
											style={{
												padding: '10px 18px',
												background: '#3b82f6',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												fontSize: '13px',
												fontWeight: '600',
												cursor: 'pointer',
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
												transition: 'all 0.2s ease',
												marginBottom: '10px',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.transform = 'translateY(-1px)';
												e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.transform = 'translateY(0)';
												e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
											}}
										>
											<span>🔐</span>
											<span>Login with PingOne (Get New Token)</span>
										</button>
									)}
								</>
							) : userToken && userTokenStatus === 'invalid' ? (
								<>
									<div style={{
										width: '100%',
										padding: '12px 14px',
										border: '1px solid #ef4444',
										borderRadius: '6px',
										fontSize: '12px',
										fontFamily: 'monospace',
										marginBottom: '10px',
										background: '#fee2e2',
										color: '#991b1b',
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
									}}>
										<span style={{ fontSize: '16px' }}>❌</span>
										<span style={{ flex: 1, wordBreak: 'break-all' }}>{userToken.substring(0, 50)}...</span>
										<button
											type="button"
											onClick={() => {
												setUserToken('');
												setUserTokenStatus('invalid');
												setCredentials((prev) => ({ ...prev, userToken: undefined }));
											}}
											style={{
												padding: '4px 8px',
												background: 'transparent',
												border: '1px solid #ef4444',
												borderRadius: '4px',
												fontSize: '11px',
												color: '#991b1b',
												cursor: 'pointer',
											}}
											title="Clear invalid token"
										>
											Clear
										</button>
									</div>
									<small style={{ 
										display: 'block', 
										fontSize: '12px', 
										color: '#dc2626', 
										marginBottom: '10px',
										lineHeight: '1.5',
										fontWeight: '500'
									}}>
										⚠️ Invalid or expired token. Please login again to obtain a new token.
									</small>
									{shouldShowLoginButton && (
										<button
											type="button"
											onClick={() => setShowUserLoginModal(true)}
											style={{
												padding: '10px 18px',
												background: '#3b82f6',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												fontSize: '13px',
												fontWeight: '600',
												cursor: 'pointer',
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
												transition: 'all 0.2s ease',
												marginBottom: '10px',
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.transform = 'translateY(-1px)';
												e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.transform = 'translateY(0)';
												e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
											}}
										>
											<span>🔐</span>
											<span>Login with PingOne</span>
										</button>
									)}
								</>
							) : (
								<>
									{shouldShowLoginButton && (
										<>
											<small style={{ 
												display: 'block', 
												fontSize: '12px', 
												color: '#6b7280', 
												marginBottom: '10px',
												lineHeight: '1.5'
											}}>
												Click "Login with PingOne" below to authenticate and automatically obtain your access token
											</small>
											<button
												type="button"
												onClick={() => setShowUserLoginModal(true)}
												style={{
													padding: '10px 18px',
													background: '#3b82f6',
													color: 'white',
													border: 'none',
													borderRadius: '6px',
													fontSize: '13px',
													fontWeight: '600',
													cursor: 'pointer',
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
													transition: 'all 0.2s ease',
													marginBottom: '10px',
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.transform = 'translateY(-1px)';
													e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.transform = 'translateY(0)';
													e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
												}}
											>
												<span>🔐</span>
												<span>Login with PingOne</span>
											</button>
										</>
									)}
								</>
							)}
						</div>
					)}
					
					{/* Worker Token Button (Optional) - Show when using User Token for loading policies */}
					{tokenType === 'user' && (
						<button
							type="button"
							onClick={() => {
								if (tokenStatus.isValid) {
									import('@/v8/services/workerTokenServiceV8').then(({ workerTokenServiceV8 }) => {
										workerTokenServiceV8.clearToken();
										window.dispatchEvent(new Event('workerTokenUpdated'));
										WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
										toastV8.success('Worker token removed');
									});
								} else {
									setShowWorkerTokenModal(true);
								}
							}}
							className="token-button"
							style={{
								padding: '12px 20px',
								background: tokenStatus.isValid ? '#10b981' : '#6366f1',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								boxShadow: tokenStatus.isValid 
									? '0 2px 4px rgba(16, 185, 129, 0.2)' 
									: '0 2px 4px rgba(99, 102, 241, 0.2)',
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.transform = 'translateY(-1px)';
								e.currentTarget.style.boxShadow = tokenStatus.isValid 
									? '0 4px 8px rgba(16, 185, 129, 0.3)' 
									: '0 4px 8px rgba(99, 102, 241, 0.3)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = tokenStatus.isValid 
									? '0 2px 4px rgba(16, 185, 129, 0.2)' 
									: '0 2px 4px rgba(99, 102, 241, 0.2)';
							}}
							title={tokenStatus.isValid ? 'Worker token is available for loading policies' : 'Add worker token to load and select device authentication policies'}
						>
							<span>🔑</span>
							<span>{tokenStatus.isValid ? 'Worker Token' : 'Add Worker Token (Optional)'}</span>
						</button>
					)}

					<button
						type="button"
						onClick={() => setShowSettingsModal(true)}
						className="token-button"
						style={{
							padding: '12px 20px',
							background: !isTokenValid || !credentials.environmentId ? '#f3f4f6' : '#6366f1',
							color: !isTokenValid || !credentials.environmentId ? '#9ca3af' : 'white',
							border: 'none',
							borderRadius: '6px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: !isTokenValid || !credentials.environmentId ? 'not-allowed' : 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							boxShadow: !isTokenValid || !credentials.environmentId 
								? 'none' 
								: '0 2px 4px rgba(99, 102, 241, 0.2)',
							transition: 'all 0.2s ease',
						}}
						disabled={!credentials.environmentId || !isTokenValid}
						onMouseEnter={(e) => {
							if (!e.currentTarget.disabled) {
								e.currentTarget.style.transform = 'translateY(-1px)';
								e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.3)';
							}
						}}
						onMouseLeave={(e) => {
							if (!e.currentTarget.disabled) {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 2px 4px rgba(99, 102, 241, 0.2)';
							}
						}}
					>
						<span>⚙️</span>
						<span>MFA Settings</span>
					</button>

					{/* Worker Token Status Display */}
					<div
						style={{
							flex: 1,
							minWidth: '200px',
							padding: '12px 16px',
							background: workerTokenStatusDisplay.background,
							border: `1px solid ${workerTokenStatusDisplay.color}`,
							borderRadius: '6px',
							fontSize: '13px',
							fontWeight: '500',
							color: workerTokenStatusDisplay.textColor,
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<span style={{ fontSize: '16px' }}>{workerTokenStatusDisplay.icon}</span>
						<span><strong>Worker Token:</strong> {workerTokenStatusDisplay.message}</span>
					</div>
					
					{/* User Token Status Display - Only show for User Flow */}
					{(registrationFlowType === 'user' || (registrationFlowType === undefined && tokenType === 'user')) && (
						<div
							style={{
								flex: 1,
								minWidth: '200px',
								padding: '12px 16px',
								background: userTokenStatusDisplay.background,
								border: `1px solid ${userTokenStatusDisplay.color}`,
								borderRadius: '6px',
								fontSize: '13px',
								fontWeight: '500',
								color: userTokenStatusDisplay.textColor,
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
							}}
						>
							<span style={{ fontSize: '16px' }}>{userTokenStatusDisplay.icon}</span>
							<span><strong>User Token:</strong> {userTokenStatusDisplay.message}</span>
						</div>
					)}
				</div>

				{!isTokenValid && (
					<div className="info-box" style={{ marginBottom: '0' }}>
						<p>
							<strong>⚠️ {tokenType === 'worker' ? 'Worker' : 'User'} Token Required:</strong>{' '}
							{tokenType === 'worker'
								? 'This flow uses a worker token to look up users and manage MFA devices. Please click "Add Token" to configure your worker token credentials.'
								: 'Click "Login with PingOne" above to authenticate and automatically obtain your access token from the Authorization Code Flow.'}
						</p>
					</div>
				)}
			</div>

			<div className="credentials-grid" style={{ 
				display: 'grid', 
				gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
				gap: '24px',
				marginBottom: '24px'
			}}>
				<div className="form-group" style={{
					display: 'flex',
					flexDirection: 'column',
				}}>
					<label 
						htmlFor="mfa-env-id"
						style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '8px',
						}}
					>
						Environment ID <span style={{ color: '#dc2626' }}>*</span>
					</label>
					<input
						id="mfa-env-id"
						type="text"
						value={credentials.environmentId}
						onChange={(e) => setCredentials({ ...credentials, environmentId: e.target.value })}
						placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
						style={{
							width: '100%',
							padding: '12px 14px',
							border: '1px solid #d1d5db',
							borderRadius: '6px',
							fontSize: '14px',
							background: 'white',
							color: '#111827',
							transition: 'border-color 0.2s ease',
						}}
						onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
						onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
					/>
					<small style={{
						display: 'block',
						marginTop: '6px',
						fontSize: '12px',
						color: '#6b7280',
					}}>
						PingOne environment ID
					</small>
				</div>

				<div className="form-group" style={{
					display: 'flex',
					flexDirection: 'column',
				}}>
					<div style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						marginBottom: '8px',
					}}>
						<label 
							htmlFor="mfa-device-auth-policy"
							style={{
								display: 'block',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
							}}
						>
							Device Authentication Policy <span style={{ color: '#dc2626' }}>*</span>
						</label>
						<button
							type="button"
							onClick={() => void refreshDeviceAuthPolicies()}
							className="token-button"
							style={{
								padding: '6px 14px',
								background: '#0284c7',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '12px',
								fontWeight: '600',
								cursor: isLoadingPolicies || !isTokenValid || !credentials.environmentId ? 'not-allowed' : 'pointer',
								opacity: isLoadingPolicies || !isTokenValid || !credentials.environmentId ? 0.6 : 1,
								boxShadow: '0 2px 4px rgba(2,132,199,0.2)',
								transition: 'all 0.2s ease',
							}}
							disabled={isLoadingPolicies || !isTokenValid || !credentials.environmentId}
							onMouseEnter={(e) => {
								if (!isLoadingPolicies && isTokenValid && credentials.environmentId) {
									e.currentTarget.style.transform = 'translateY(-1px)';
									e.currentTarget.style.boxShadow = '0 4px 8px rgba(2,132,199,0.3)';
								}
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 2px 4px rgba(2,132,199,0.2)';
							}}
						>
							{isLoadingPolicies ? 'Refreshing…' : 'Refresh'}
						</button>
					</div>

					{policiesError && (
						<div className="info-box" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
							<strong>Failed to load policies:</strong> {policiesError}. 
							{tokenType === 'user' && !tokenStatus.isValid && (
								<> To load and select policies, add a worker token using the "Add Worker Token (Optional)" button above, or enter a policy ID manually.</>
							)}
							{tokenType === 'user' && tokenStatus.isValid && (
								<> Retry after verifying worker token access.</>
							)}
							{tokenType === 'worker' && (
								<> Retry after verifying access.</>
							)}
						</div>
					)}
					
					{tokenType === 'user' && !tokenStatus.isValid && !policiesError && deviceAuthPolicies.length === 0 && (
						<div className="info-box" style={{ 
							background: '#fef3c7', 
							border: '1px solid #fcd34d', 
							color: '#92400e',
							marginTop: '8px',
							marginBottom: '8px'
						}}>
							<strong>💡 Optional:</strong> Add a worker token to load and select device authentication policies. 
							You can also enter a policy ID manually, or use the default policy if one is already set.
						</div>
					)}

					{deviceAuthPolicies.length > 0 ? (
						<select
							id="mfa-device-auth-policy"
							value={credentials.deviceAuthenticationPolicyId || ''}
							onChange={(e) =>
								setCredentials({
									...credentials,
									deviceAuthenticationPolicyId: e.target.value,
								})
							}
							style={{
								width: '100%',
								padding: '12px 14px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								background: 'white',
								color: '#111827',
								cursor: 'pointer',
								transition: 'border-color 0.2s ease',
							}}
							onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
							onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
						>
							{deviceAuthPolicies.map((policy) => (
								<option key={policy.id} value={policy.id}>
									{policy.name || policy.id} ({policy.id})
								</option>
							))}
						</select>
					) : (
						<input
							id="mfa-device-auth-policy"
							type="text"
							value={credentials.deviceAuthenticationPolicyId || ''}
							onChange={(e) =>
								setCredentials({
									...credentials,
									deviceAuthenticationPolicyId: e.target.value.trim(),
								})
							}
							placeholder="Enter a Device Authentication Policy ID"
							style={{
								width: '100%',
								padding: '12px 14px',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								background: 'white',
								color: '#111827',
								transition: 'border-color 0.2s ease',
							}}
							onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
							onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
						/>
					)}

					<div
						style={{
							marginTop: '10px',
							padding: '12px 14px',
							background: '#f8fafc',
							borderRadius: '6px',
							fontSize: '12px',
							color: '#64748b',
							lineHeight: 1.5,
							border: '1px solid #e2e8f0',
						}}
					>
						{policyDescription || `Determines which PingOne policy governs ${deviceTypeLabel} challenges.`}
					</div>
				</div>

				<div className="form-group" style={{
					display: 'flex',
					flexDirection: 'column',
				}}>
					<label 
						htmlFor="mfa-username"
						style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '8px',
						}}
					>
						Username <span style={{ color: '#dc2626' }}>*</span>
					</label>
					<input
						id="mfa-username"
						type="text"
						value={credentials.username}
						onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
						placeholder="john.doe"
						style={{
							width: '100%',
							padding: '12px 14px',
							border: '1px solid #d1d5db',
							borderRadius: '6px',
							fontSize: '14px',
							background: 'white',
							color: '#111827',
							transition: 'border-color 0.2s ease',
						}}
						onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
						onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
					/>
					<small style={{
						display: 'block',
						marginTop: '6px',
						fontSize: '12px',
						color: '#6b7280',
					}}>
						PingOne username to register MFA device for
					</small>
				</div>
			</div>
		</div>
	);
};

