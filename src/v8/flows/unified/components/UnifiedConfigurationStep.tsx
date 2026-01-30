/**
 * @file UnifiedConfigurationStep.tsx
 * @module v8/flows/unified/components
 * @description Step 0: Configuration - Environment and credential setup
 * @version 8.0.0
 * @since 2026-01-29
 *
 * Purpose: Configure environment, credentials, and token type before device registration
 *
 * Flow:
 * 1. Enter environment ID, username
 * 2. Select token type (Worker or User)
 * 3. Select device authentication policy (optional)
 * 4. Validate configuration
 * 5. Navigate to device selection step
 *
 * @example
 * <UnifiedConfigurationStep
 *   {...mfaFlowBaseProps}
 *   config={config}
 *   registrationFlowType="admin"
 * />
 */

import React, { useCallback, useEffect, useState } from 'react';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import type { DeviceFlowConfig } from '@/v8/config/deviceFlowConfigTypes';
import type { MFAFlowBaseRenderProps } from '@/v8/flows/shared/MFAFlowBaseV8';
import type { TokenType } from '@/v8/flows/shared/MFATypes';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenUIServiceV8 } from '@/v8/services/workerTokenUIServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[⚙️ UNIFIED-CONFIGURATION-STEP]';

// ============================================================================
// PROPS INTERFACE
// ============================================================================

export interface UnifiedConfigurationStepProps extends MFAFlowBaseRenderProps {
	/** Device flow configuration */
	config: DeviceFlowConfig;

	/** Registration flow type (admin uses worker token, user uses user token) */
	registrationFlowType?: 'admin' | 'user';
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Unified Configuration Step (Step 0)
 *
 * Handles environment and credential configuration for unified MFA flow.
 */
export const UnifiedConfigurationStep: React.FC<UnifiedConfigurationStepProps> = ({
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
	isLoading,
	setIsLoading,
	nav,
	config,
	registrationFlowType = 'admin',
}) => {
	console.log(`${MODULE_TAG} Rendering configuration step for:`, config.deviceType);

	// ========================================================================
	// LOCAL STATE
	// ========================================================================

	const [environmentId, setEnvironmentId] = useState(credentials.environmentId || '');
	const [username, setUsername] = useState(credentials.username || '');
	const [tokenType, setTokenType] = useState<TokenType>(
		registrationFlowType === 'admin' ? 'worker' : credentials.tokenType || 'worker'
	);
	const [selectedPolicyId, setSelectedPolicyId] = useState(
		credentials.deviceAuthenticationPolicyId || ''
	);

	// Validation errors
	const [errors, setErrors] = useState<Record<string, string>>({});

	// ========================================================================
	// EFFECTS
	// ========================================================================

	/**
	 * Auto-populate environment ID from worker token if available
	 */
	useEffect(() => {
		if (!environmentId && tokenStatus.isValid) {
			const workerCreds = workerTokenServiceV8.loadCredentialsSync();
			if (workerCreds?.environmentId) {
				console.log(`${MODULE_TAG} Auto-populating environment ID:`, workerCreds.environmentId);
				setEnvironmentId(workerCreds.environmentId);
				setCredentials((prev) => ({
					...prev,
					environmentId: workerCreds.environmentId,
					region: workerCreds.region || prev.region || 'us',
					customDomain: workerCreds.customDomain || prev.customDomain,
				}));
			}
		}
	}, [tokenStatus.isValid, environmentId, setCredentials]);

	/**
	 * Auto-select first device authentication policy when loaded
	 */
	useEffect(() => {
		if (deviceAuthPolicies.length > 0 && !selectedPolicyId) {
			const firstPolicy = deviceAuthPolicies[0];
			console.log(`${MODULE_TAG} Auto-selecting first policy:`, firstPolicy.name);
			setSelectedPolicyId(firstPolicy.id);
			setCredentials((prev) => ({
				...prev,
				deviceAuthenticationPolicyId: firstPolicy.id,
			}));
		}
	}, [deviceAuthPolicies, selectedPolicyId, setCredentials]);

	/**
	 * Force worker token for admin registration flow
	 */
	useEffect(() => {
		if (registrationFlowType === 'admin' && tokenType !== 'worker') {
			console.log(`${MODULE_TAG} Admin flow - forcing worker token`);
			setTokenType('worker');
		}
	}, [registrationFlowType, tokenType]);

	// ========================================================================
	// HANDLERS
	// ========================================================================

	/**
	 * Validate configuration fields
	 */
	const validateConfiguration = useCallback((): boolean => {
		const newErrors: Record<string, string> = {};

		// Validate environment ID
		if (!environmentId.trim()) {
			newErrors.environmentId = 'Environment ID is required';
		}

		// Validate username
		if (!username.trim()) {
			newErrors.username = 'Username is required';
		}

		// Validate token based on token type
		if (tokenType === 'worker') {
			if (!tokenStatus.isValid) {
				newErrors.token = 'Valid worker token is required';
			}
		} else if (tokenType === 'user') {
			if (!credentials.userToken) {
				newErrors.token = 'User token is required. Please log in.';
			}
		}

		setErrors(newErrors);

		if (Object.keys(newErrors).length > 0) {
			console.error(`${MODULE_TAG} Validation failed:`, newErrors);
			nav.setValidationErrors(Object.values(newErrors));
			return false;
		}

		return true;
	}, [environmentId, username, tokenType, tokenStatus, credentials, nav]);

	/**
	 * Handle continue button click
	 */
	const handleContinue = useCallback(() => {
		console.log(`${MODULE_TAG} Continuing to device selection`);

		// Validate configuration
		if (!validateConfiguration()) {
			toastV8.error('Please fix the configuration errors');
			return;
		}

		// Update credentials with final values
		setCredentials((prev) => ({
			...prev,
			environmentId: environmentId.trim(),
			username: username.trim(),
			tokenType,
			deviceAuthenticationPolicyId: selectedPolicyId,
			deviceType: config.deviceType,
		}));

		// Mark step as complete
		nav.markStepComplete();

		// Navigate to next step (device selection)
		nav.goToNext();
	}, [
		environmentId,
		username,
		tokenType,
		selectedPolicyId,
		config,
		validateConfiguration,
		setCredentials,
		nav,
	]);

	/**
	 * Handle environment ID change
	 */
	const handleEnvironmentIdChange = useCallback((value: string) => {
		setEnvironmentId(value);
		setErrors((prev) => {
			const { environmentId, ...rest } = prev;
			return rest;
		});
	}, []);

	/**
	 * Handle username change
	 */
	const handleUsernameChange = useCallback((value: string) => {
		setUsername(value);
		setErrors((prev) => {
			const { username, ...rest } = prev;
			return rest;
		});
	}, []);

	/**
	 * Handle token type change
	 */
	const handleTokenTypeChange = useCallback(
		(type: TokenType) => {
			if (registrationFlowType === 'admin' && type === 'user') {
				toastV8.warning('Admin registration flow requires worker token');
				return;
			}
			console.log(`${MODULE_TAG} Token type changed to:`, type);
			setTokenType(type);
			setErrors((prev) => {
				const { token, ...rest } = prev;
				return rest;
			});
		},
		[registrationFlowType]
	);

	/**
	 * Handle policy selection change
	 */
	const handlePolicyChange = useCallback(
		(policyId: string) => {
			console.log(`${MODULE_TAG} Policy changed to:`, policyId);
			setSelectedPolicyId(policyId);
			setCredentials((prev) => ({
				...prev,
				deviceAuthenticationPolicyId: policyId,
			}));
		},
		[setCredentials]
	);

	// ========================================================================
	// COMPUTED PROPERTIES
	// ========================================================================

	const selectedPolicy = deviceAuthPolicies.find((p) => p.id === selectedPolicyId);
	const canProceed =
		environmentId.trim() &&
		username.trim() &&
		(tokenType === 'worker' ? tokenStatus.isValid : !!credentials.userToken);

	// ========================================================================
	// RENDER
	// ========================================================================

	return (
		<div
			className="unified-configuration-step"
			style={{
				maxWidth: '900px',
				margin: '0 auto',
				padding: '24px',
			}}
		>
			{/* Step Header */}
			<div
				style={{
					background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
					borderRadius: '12px',
					padding: '28px 32px',
					marginBottom: '28px',
					boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
				}}
			>
				<h2
					style={{
						margin: '0 0 8px 0',
						fontSize: '26px',
						fontWeight: '700',
						color: '#ffffff',
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
					}}
				>
					{config.icon} Configure {config.displayName} Registration
				</h2>
				<p
					style={{
						margin: 0,
						fontSize: '15px',
						color: 'rgba(255, 255, 255, 0.9)',
						lineHeight: '1.5',
					}}
				>
					Enter your environment and user credentials to begin the registration process.
				</p>
			</div>

			{/* Configuration Form */}
			<div
				style={{
					background: '#ffffff',
					borderRadius: '12px',
					padding: '28px',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					border: '1px solid #e5e7eb',
				}}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
					{/* Environment ID */}
					<div className="form-field">
						<label
							htmlFor="environmentId"
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
							id="environmentId"
							type="text"
							value={environmentId}
							onChange={(e) => handleEnvironmentIdChange(e.target.value)}
							placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
							style={{
								width: '100%',
								padding: '12px 14px',
								border: `1px solid ${errors.environmentId ? '#dc2626' : '#d1d5db'}`,
								borderRadius: '8px',
								fontSize: '14px',
								color: '#111827',
								background: '#ffffff',
								transition: 'all 0.2s ease',
								boxSizing: 'border-box',
							}}
							onFocus={(e) => {
								e.currentTarget.style.borderColor = '#8b5cf6';
								e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
							}}
							onBlur={(e) => {
								e.currentTarget.style.borderColor = errors.environmentId ? '#dc2626' : '#d1d5db';
								e.currentTarget.style.boxShadow = 'none';
							}}
							aria-invalid={!!errors.environmentId}
							aria-describedby={errors.environmentId ? 'environmentId-error' : undefined}
						/>
						{errors.environmentId && (
							<span
								id="environmentId-error"
								style={{
									display: 'block',
									marginTop: '6px',
									fontSize: '13px',
									color: '#dc2626',
								}}
								role="alert"
							>
								{errors.environmentId}
							</span>
						)}
					</div>

					{/* Username */}
					<div className="form-field">
						<label
							htmlFor="username"
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
							id="username"
							type="text"
							value={username}
							onChange={(e) => handleUsernameChange(e.target.value)}
							placeholder="user@example.com"
							style={{
								width: '100%',
								padding: '12px 14px',
								border: `1px solid ${errors.username ? '#dc2626' : '#d1d5db'}`,
								borderRadius: '8px',
								fontSize: '14px',
								color: '#111827',
								background: '#ffffff',
								transition: 'all 0.2s ease',
								boxSizing: 'border-box',
							}}
							onFocus={(e) => {
								e.currentTarget.style.borderColor = '#8b5cf6';
								e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
							}}
							onBlur={(e) => {
								e.currentTarget.style.borderColor = errors.username ? '#dc2626' : '#d1d5db';
								e.currentTarget.style.boxShadow = 'none';
							}}
							aria-invalid={!!errors.username}
							aria-describedby={errors.username ? 'username-error' : undefined}
						/>
						{errors.username && (
							<span
								id="username-error"
								style={{
									display: 'block',
									marginTop: '6px',
									fontSize: '13px',
									color: '#dc2626',
								}}
								role="alert"
							>
								{errors.username}
							</span>
						)}
					</div>

					{/* Token Type Selection */}
				<div className="form-field">
					<label
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							fontSize: '14px',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '12px',
						}}
					>
						Token Type <span className="required">*</span>
						<MFAInfoButtonV8 contentKey="mfa.registrationFlowType" displayMode="modal" />
					</label>
					<div
						style={{
							display: 'flex',
							gap: '16px',
							flexWrap: 'wrap',
						}}
					>
						{/* Worker Token Option */}
						<label
							style={{
								flex: 1,
								minWidth: '200px',
								padding: '16px 20px',
								border: `2px solid ${tokenType === 'worker' ? '#8b5cf6' : '#e5e7eb'}`,
								borderRadius: '10px',
								background: tokenType === 'worker' ? '#f5f3ff' : '#ffffff',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								boxShadow:
									tokenType === 'worker'
										? '0 4px 12px rgba(139, 92, 246, 0.15)'
										: '0 1px 3px rgba(0, 0, 0, 0.05)',
							}}
							onMouseEnter={(e) => {
								if (tokenType !== 'worker') {
									e.currentTarget.style.borderColor = '#c4b5fd';
									e.currentTarget.style.background = '#faf5ff';
								}
							}}
							onMouseLeave={(e) => {
								if (tokenType !== 'worker') {
									e.currentTarget.style.borderColor = '#e5e7eb';
									e.currentTarget.style.background = '#ffffff';
								}
							}}
						>
							<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
								<input
									type="radio"
									name="tokenType"
									value="worker"
									checked={tokenType === 'worker'}
									onChange={() => handleTokenTypeChange('worker')}
									style={{
										width: '20px',
										height: '20px',
										accentColor: '#8b5cf6',
										marginTop: '2px',
										cursor: 'pointer',
									}}
								/>
								<div style={{ flex: 1 }}>
									<div
										style={{
											fontSize: '15px',
											fontWeight: '600',
											color: tokenType === 'worker' ? '#6d28d9' : '#1f2937',
											marginBottom: '4px',
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
										}}
									>
										🔑 Worker Token
										{registrationFlowType === 'admin' && (
											<span
												style={{
													fontSize: '11px',
													fontWeight: '600',
													padding: '2px 8px',
													background: '#fef3c7',
													color: '#92400e',
													borderRadius: '4px',
												}}
											>
												Required
											</span>
										)}
									</div>
									<div
										style={{
											fontSize: '13px',
											color: '#6b7280',
											lineHeight: '1.5',
										}}
									>
										Administrative API access for backend operations
									</div>
								</div>
							</div>
						</label>

						{/* User Token Option */}
						<label
							style={{
								flex: 1,
								minWidth: '200px',
								padding: '16px 20px',
								border: `2px solid ${tokenType === 'user' ? '#8b5cf6' : '#e5e7eb'}`,
								borderRadius: '10px',
								background: tokenType === 'user' ? '#f5f3ff' : '#ffffff',
								cursor: registrationFlowType === 'admin' ? 'not-allowed' : 'pointer',
								transition: 'all 0.2s ease',
								opacity: registrationFlowType === 'admin' ? 0.5 : 1,
								boxShadow:
									tokenType === 'user'
										? '0 4px 12px rgba(139, 92, 246, 0.15)'
										: '0 1px 3px rgba(0, 0, 0, 0.05)',
							}}
							onMouseEnter={(e) => {
								if (tokenType !== 'user' && registrationFlowType !== 'admin') {
									e.currentTarget.style.borderColor = '#c4b5fd';
									e.currentTarget.style.background = '#faf5ff';
								}
							}}
							onMouseLeave={(e) => {
								if (tokenType !== 'user' && registrationFlowType !== 'admin') {
									e.currentTarget.style.borderColor = '#e5e7eb';
									e.currentTarget.style.background = '#ffffff';
								}
							}}
						>
							<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
								<input
									type="radio"
									name="tokenType"
									value="user"
									checked={tokenType === 'user'}
									onChange={() => handleTokenTypeChange('user')}
									disabled={registrationFlowType === 'admin'}
									style={{
										width: '20px',
										height: '20px',
										accentColor: '#8b5cf6',
										marginTop: '2px',
										cursor: registrationFlowType === 'admin' ? 'not-allowed' : 'pointer',
									}}
								/>
								<div style={{ flex: 1 }}>
									<div
										style={{
											fontSize: '15px',
											fontWeight: '600',
											color: tokenType === 'user' ? '#6d28d9' : '#1f2937',
											marginBottom: '4px',
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
										}}
									>
										👤 User Token
									</div>
									<div
										style={{
											fontSize: '13px',
											color: '#6b7280',
											lineHeight: '1.5',
										}}
									>
										OAuth access token for user-initiated registration
									</div>
								</div>
							</div>
						</label>
					</div>
				</div>

				{/* Token Status Display */}
				<div className="token-status-section">
					{tokenType === 'worker' && (
						<>
							<WorkerTokenUIServiceV8
								mode="detailed"
								showRefresh={true}
								showStatusDisplay={true}
								statusSize="large"
								context="mfa"
								environmentId={environmentId}
								onEnvironmentIdUpdate={handleEnvironmentIdChange}
							/>
							{errors.token && (
								<span
									className="error-message"
									role="alert"
									style={{ marginTop: '12px', display: 'block' }}
								>
									{errors.token}
								</span>
							)}
						</>
					)}
					{tokenType === 'user' && (
						<div className="token-status-card">
							<h4>User Token Status</h4>
							<div className={`status-indicator ${credentials.userToken ? 'valid' : 'invalid'}`}>
								{credentials.userToken ? '✓ Logged In' : '✗ Not Logged In'}
							</div>
							<button
								type="button"
								onClick={() => setShowUserLoginModal(true)}
								className="button-link"
							>
								{credentials.userToken ? 'Re-authenticate' : 'Login via OAuth'}
							</button>
							{errors.token && (
								<span
									className="error-message"
									role="alert"
									style={{ marginTop: '12px', display: 'block' }}
								>
									{errors.token}
								</span>
							)}
						</div>
					)}
				</div>

				{/* Device Authentication Policy */}
				{deviceAuthPolicies.length > 0 && (
					<div className="form-field">
						<label htmlFor="deviceAuthPolicy">
							Device Authentication Policy
							<MFAInfoButtonV8 contentKey="device.authentication.policy" displayMode="modal" />
						</label>
						<select
							id="deviceAuthPolicy"
							value={selectedPolicyId}
							onChange={(e) => handlePolicyChange(e.target.value)}
							disabled={isLoadingPolicies}
						>
							{deviceAuthPolicies.map((policy) => (
								<option key={policy.id} value={policy.id}>
									{policy.name}
								</option>
							))}
						</select>
						{selectedPolicy?.description && (
							<p className="field-hint">{selectedPolicy.description}</p>
						)}
					</div>
				)}

					{/* Policy Loading/Error States */}
					{isLoadingPolicies && (
						<div className="loading-indicator">Loading device authentication policies...</div>
					)}
					{policiesError && (
						<div className="error-message" role="alert">
							{policiesError}
							<button type="button" onClick={refreshDeviceAuthPolicies} className="button-link">
								Retry
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Action Buttons */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginTop: '32px',
					paddingTop: '24px',
					borderTop: '1px solid #e5e7eb',
				}}
			>
				<button
					type="button"
					onClick={() => setShowSettingsModal(true)}
					style={{
						padding: '12px 20px',
						background: '#ffffff',
						border: '1px solid #d1d5db',
						borderRadius: '8px',
						fontSize: '14px',
						fontWeight: '500',
						color: '#374151',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						transition: 'all 0.2s ease',
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = '#f9fafb';
						e.currentTarget.style.borderColor = '#9ca3af';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = '#ffffff';
						e.currentTarget.style.borderColor = '#d1d5db';
					}}
				>
					⚙️ Settings
				</button>

				<button
					type="button"
					onClick={handleContinue}
					disabled={!canProceed || isLoading}
					style={{
						padding: '14px 28px',
						background: canProceed && !isLoading ? '#8b5cf6' : '#d1d5db',
						border: 'none',
						borderRadius: '8px',
						fontSize: '15px',
						fontWeight: '600',
						color: canProceed && !isLoading ? '#ffffff' : '#9ca3af',
						cursor: canProceed && !isLoading ? 'pointer' : 'not-allowed',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						transition: 'all 0.2s ease',
						boxShadow: canProceed && !isLoading ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
					}}
					onMouseEnter={(e) => {
						if (canProceed && !isLoading) {
							e.currentTarget.style.background = '#7c3aed';
							e.currentTarget.style.transform = 'translateY(-1px)';
							e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
						}
					}}
					onMouseLeave={(e) => {
						if (canProceed && !isLoading) {
							e.currentTarget.style.background = '#8b5cf6';
							e.currentTarget.style.transform = 'translateY(0)';
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
						}
					}}
				>
					{isLoading ? 'Loading...' : 'Continue →'}
				</button>
			</div>
		</div>
	);
};

export default UnifiedConfigurationStep;
