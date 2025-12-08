/**
 * @file TOTPConfigurationPageV8.tsx
 * @module v8/flows/types
 * @description TOTP Configuration and Education Page
 * @version 8.1.0
 *
 * This page provides:
 * - TOTP education and information
 * - Device Authentication Policy selection
 * - Configuration before device registration
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiArrowRight } from 'react-icons/fi';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { MFAConfigurationStepV8 } from '../shared/MFAConfigurationStepV8';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { UserLoginModalV8 } from '@/v8/components/UserLoginModalV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import type { MFACredentials } from '../shared/MFATypes';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';

const MODULE_TAG = '[⏱️ TOTP-CONFIG-V8]';

export const TOTPConfigurationPageV8: React.FC = () => {
	const navigate = useNavigate();
	
	// Load saved credentials
	const [credentials, setCredentials] = useState<MFACredentials>(() => {
		const stored = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
			flowKey: 'mfa-flow-v8',
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});

		return {
			environmentId: stored.environmentId || '',
			clientId: stored.clientId || '',
			username: stored.username || '',
			deviceType: 'TOTP' as const,
			countryCode: stored.countryCode || '+1',
			phoneNumber: stored.phoneNumber || '',
			email: stored.email || '',
			deviceName: stored.deviceName || '',
			deviceAuthenticationPolicyId: stored.deviceAuthenticationPolicyId || '',
			registrationPolicyId: stored.registrationPolicyId || '',
			tokenType: stored.tokenType || 'worker',
			userToken: stored.userToken || '',
		};
	});

	// Token and modal state
	const [tokenStatus, setTokenStatus] = useState(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [showUserLoginModal, setShowUserLoginModal] = useState(false);
	const [showSettingsModal, setShowSettingsModal] = useState(false);

	// Policy state
	const [deviceAuthPolicies, setDeviceAuthPolicies] = useState([]);
	const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
	const [policiesError, setPoliciesError] = useState<string | null>(null);

	// API display visibility
	const [isApiDisplayVisible, setIsApiDisplayVisible] = useState(false);

	const fetchDeviceAuthPolicies = useCallback(async () => {
		// This function is now passed to MFAConfigurationStepV8
		// The actual logic for fetching policies is in mfaServiceV8
	}, []);

	useEffect(() => {
		const checkToken = () => {
			setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
		};
		const interval = setInterval(checkToken, 30000);
		checkToken();
		return () => clearInterval(interval);
	}, []);

	const handleUserTokenReceived = useCallback((token: string) => {
		setCredentials((prev) => ({ ...prev, userToken: token, tokenType: 'user' }));
		setShowUserLoginModal(false);
		toastV8.success('User token received and set!');
	}, []);

	useEffect(() => {
		const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
			setIsApiDisplayVisible(visible);
		});
		return () => unsubscribe();
	}, []);

	const handleProceedToRegistration = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();

		const tokenType = credentials.tokenType || 'worker';
		const isTokenValid = tokenType === 'worker'
			? tokenStatus.isValid 
			: !!credentials.userToken?.trim();

		if (!credentials.environmentId?.trim() || !credentials.username?.trim() || !credentials.deviceAuthenticationPolicyId?.trim() || !isTokenValid) {
			toastV8.warning('Please fill in all required configuration fields and ensure a valid token is provided.');
			return;
		}

		console.log(`${MODULE_TAG} Proceeding to registration with credentials:`, credentials);

		navigate('/v8/mfa/register/totp/device', {
			replace: false,
			state: {
				deviceAuthenticationPolicyId: credentials.deviceAuthenticationPolicyId,
				environmentId: credentials.environmentId,
				username: credentials.username,
				tokenType: credentials.tokenType,
				userToken: credentials.userToken,
				configured: true, // Flag to indicate configuration is complete
			},
		});
	}, [navigate, credentials, tokenStatus.isValid]);

	return (
		<div style={{ minHeight: '100vh', background: '#f9fafb' }}>
			<MFANavigationV8 currentPage="registration" showBackToMain={true} />

			<SuperSimpleApiDisplayV8 flowFilter="mfa" />

			<div style={{
				maxWidth: '1200px',
				margin: '0 auto',
				padding: '32px 20px',
				paddingBottom: isApiDisplayVisible ? '450px' : '32px',
				transition: 'padding-bottom 0.3s ease',
			}}>
				{/* Header */}
				<div
					style={{
						background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
						borderRadius: '12px',
						padding: '32px',
						marginBottom: '32px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
						<FiClock size={32} color="white" />
						<h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'white' }}>
							TOTP Configuration
						</h1>
					</div>
					<p style={{ margin: 0, fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)' }}>
						Configure TOTP device registration, learn about authenticator apps, and prepare for device setup
					</p>
				</div>

				{/* Shared Configuration Step */}
				<div style={{
					background: 'white',
					borderRadius: '8px',
					padding: '24px',
					marginBottom: '24px',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				}}>
					<MFAConfigurationStepV8
						credentials={credentials}
						setCredentials={setCredentials}
						tokenStatus={tokenStatus}
						deviceAuthPolicies={deviceAuthPolicies}
						isLoadingPolicies={isLoadingPolicies}
						policiesError={policiesError}
						refreshDeviceAuthPolicies={fetchDeviceAuthPolicies}
						showWorkerTokenModal={showWorkerTokenModal}
						setShowWorkerTokenModal={setShowWorkerTokenModal}
						showUserLoginModal={showUserLoginModal}
						setShowUserLoginModal={setShowUserLoginModal}
						showSettingsModal={showSettingsModal}
						setShowSettingsModal={setShowSettingsModal}
						deviceType="TOTP"
						deviceTypeLabel="TOTP"
						policyDescription="Determines which PingOne policy governs TOTP MFA challenges."
						mfaState={{ deviceId: '', otpCode: '', deviceStatus: '', verificationResult: null }}
						setMfaState={() => {}}
						isLoading={false}
						setIsLoading={() => {}}
						nav={{ currentStep: 0, goToNext: () => {}, goToPrevious: () => {}, goToStep: () => {}, reset: () => {}, setValidationErrors: () => {}, setValidationWarnings: () => {} } as any}
						showDeviceLimitModal={false}
						setShowDeviceLimitModal={() => {}}
					/>
				</div>

				{/* Proceed Button */}
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
					<button
						type="button"
						onClick={() => navigate('/v8/mfa-hub')}
						style={{
							padding: '12px 24px',
							border: '1px solid #d1d5db',
							borderRadius: '6px',
							background: 'white',
							color: '#374151',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleProceedToRegistration}
						disabled={
							!credentials.environmentId?.trim() ||
							!credentials.username?.trim() ||
							!credentials.deviceAuthenticationPolicyId?.trim() ||
							!(credentials.tokenType === 'worker' ? tokenStatus.isValid : !!credentials.userToken?.trim())
						}
						style={{
							padding: '12px 24px',
							border: 'none',
							borderRadius: '6px',
							background: (credentials.environmentId?.trim() && credentials.username?.trim() && credentials.deviceAuthenticationPolicyId?.trim() && (credentials.tokenType === 'worker' ? tokenStatus.isValid : !!credentials.userToken?.trim())) ? '#f59e0b' : '#9ca3af',
							color: 'white',
							fontSize: '16px',
							fontWeight: '600',
							cursor: (credentials.environmentId?.trim() && credentials.username?.trim() && credentials.deviceAuthenticationPolicyId?.trim() && (credentials.tokenType === 'worker' ? tokenStatus.isValid : !!credentials.userToken?.trim())) ? 'pointer' : 'not-allowed',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						Proceed to TOTP Registration
						<FiArrowRight size={18} />
					</button>
				</div>
			</div>

			{/* Modals */}
			{showWorkerTokenModal && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => {
						setShowWorkerTokenModal(false);
						setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
					}}
				/>
			)}
			{showUserLoginModal && (
				<UserLoginModalV8
					isOpen={showUserLoginModal}
					onClose={() => setShowUserLoginModal(false)}
					onTokenReceived={handleUserTokenReceived}
					environmentId={credentials.environmentId}
				/>
			)}
		</div>
	);
};
