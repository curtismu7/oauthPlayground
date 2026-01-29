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
		<div className="unified-configuration-step">
			{/* Step Header */}
			<div className="step-header">
				<h2>Configure {config.displayName} Registration</h2>
				<p className="step-description">
					Enter your environment and user credentials to begin the registration process.
				</p>
			</div>

			{/* Configuration Form */}
			<div className="configuration-form">
				{/* Environment ID */}
				<div className="form-field">
					<label htmlFor="environmentId">
						Environment ID <span className="required">*</span>
					</label>
					<input
						id="environmentId"
						type="text"
						value={environmentId}
						onChange={(e) => handleEnvironmentIdChange(e.target.value)}
						placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
						className={errors.environmentId ? 'input-error' : ''}
						aria-invalid={!!errors.environmentId}
						aria-describedby={errors.environmentId ? 'environmentId-error' : undefined}
					/>
					{errors.environmentId && (
						<span id="environmentId-error" className="error-message" role="alert">
							{errors.environmentId}
						</span>
					)}
				</div>

				{/* Username */}
				<div className="form-field">
					<label htmlFor="username">
						Username <span className="required">*</span>
					</label>
					<input
						id="username"
						type="text"
						value={username}
						onChange={(e) => handleUsernameChange(e.target.value)}
						placeholder="user@example.com"
						className={errors.username ? 'input-error' : ''}
						aria-invalid={!!errors.username}
						aria-describedby={errors.username ? 'username-error' : undefined}
					/>
					{errors.username && (
						<span id="username-error" className="error-message" role="alert">
							{errors.username}
						</span>
					)}
				</div>

				{/* Token Type Selection */}
				<div className="form-field">
					<label>
						Token Type <span className="required">*</span>
						<MFAInfoButtonV8 infoKey="tokenType" />
					</label>
					<div className="token-type-options">
						<label className="radio-option">
							<input
								type="radio"
								name="tokenType"
								value="worker"
								checked={tokenType === 'worker'}
								onChange={() => handleTokenTypeChange('worker')}
							/>
							<span>Worker Token {registrationFlowType === 'admin' && '(Required)'}</span>
						</label>
						<label className="radio-option">
							<input
								type="radio"
								name="tokenType"
								value="user"
								checked={tokenType === 'user'}
								onChange={() => handleTokenTypeChange('user')}
								disabled={registrationFlowType === 'admin'}
							/>
							<span>User Token</span>
						</label>
					</div>
				</div>

				{/* Token Status Display */}
				<div className="token-status-section">
					{tokenType === 'worker' && (
						<div className="token-status-card">
							<h4>Worker Token Status</h4>
							<div className={`status-indicator ${tokenStatus.isValid ? 'valid' : 'invalid'}`}>
								{tokenStatus.isValid ? '✓ Valid' : '✗ Invalid or Missing'}
							</div>
							{tokenStatus.expiresAt && (
								<p className="token-expiry">
									Expires: {new Date(tokenStatus.expiresAt).toLocaleString()}
								</p>
							)}
							<button
								type="button"
								onClick={() => setShowWorkerTokenModal(true)}
								className="button-link"
							>
								{tokenStatus.isValid ? 'Update Token' : 'Set Worker Token'}
							</button>
						</div>
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
						</div>
					)}
					{errors.token && (
						<span className="error-message" role="alert">
							{errors.token}
						</span>
					)}
				</div>

				{/* Device Authentication Policy */}
				{deviceAuthPolicies.length > 0 && (
					<div className="form-field">
						<label htmlFor="deviceAuthPolicy">
							Device Authentication Policy
							<MFAInfoButtonV8 infoKey="deviceAuthPolicy" />
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

			{/* Action Buttons */}
			<div className="step-actions">
				<button
					type="button"
					onClick={() => setShowSettingsModal(true)}
					className="button-secondary"
				>
					⚙️ Settings
				</button>

				<button
					type="button"
					onClick={handleContinue}
					disabled={!canProceed || isLoading}
					className="button-primary"
				>
					{isLoading ? 'Loading...' : 'Continue →'}
				</button>
			</div>
		</div>
	);
};

export default UnifiedConfigurationStep;
