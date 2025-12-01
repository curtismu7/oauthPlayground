/**
 * @file TOTPConfigurationPageV8.tsx
 * @module v8/flows/types
 * @description TOTP Configuration and Education Page
 * @version 8.0.0
 *
 * This page provides:
 * - TOTP education and information
 * - Device Authentication Policy selection
 * - Configuration before device registration
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiInfo, FiArrowRight, FiSettings, FiBook } from 'react-icons/fi';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import type { DeviceAuthenticationPolicy } from '../shared/MFATypes';
import { ApiDisplayCheckbox, SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';

const MODULE_TAG = '[⏱️ TOTP-CONFIG-V8]';

export const TOTPConfigurationPageV8: React.FC = () => {
	const navigate = useNavigate();
	
	// Environment and token state
	const [environmentId, setEnvironmentId] = useState<string>('');
	const [tokenStatus, setTokenStatus] = useState(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// Policy state
	const [deviceAuthPolicies, setDeviceAuthPolicies] = useState<DeviceAuthenticationPolicy[]>([]);
	const [selectedDeviceAuthPolicy, setSelectedDeviceAuthPolicy] = useState<DeviceAuthenticationPolicy | null>(null);
	const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
	const [policiesError, setPoliciesError] = useState<string | null>(null);

	// API display visibility
	const [isApiDisplayVisible, setIsApiDisplayVisible] = useState(false);

	// Load environment ID
	useEffect(() => {
		const envId = EnvironmentIdServiceV8.getEnvironmentId();
		if (envId) {
			setEnvironmentId(envId);
		}
	}, []);

	// Load device authentication policies
	const loadPolicies = useCallback(async () => {
		if (!environmentId || !tokenStatus.isValid) {
			return;
		}

		setIsLoadingPolicies(true);
		setPoliciesError(null);

		try {
			const policies = await MFAServiceV8.listDeviceAuthenticationPolicies(environmentId);
			setDeviceAuthPolicies(policies);
			
			// Auto-select default policy if available
			const defaultPolicy = policies.find((p) => p.default);
			if (defaultPolicy) {
				setSelectedDeviceAuthPolicy(defaultPolicy);
			} else if (policies.length === 1) {
				setSelectedDeviceAuthPolicy(policies[0]);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.error(`${MODULE_TAG} Failed to load policies:`, error);
			setPoliciesError(errorMessage);
			toastV8.error(`Failed to load policies: ${errorMessage}`);
		} finally {
			setIsLoadingPolicies(false);
		}
	}, [environmentId, tokenStatus.isValid]);

	// Load policies when environment and token are ready
	useEffect(() => {
		if (environmentId && tokenStatus.isValid) {
			void loadPolicies();
		}
	}, [environmentId, tokenStatus.isValid, loadPolicies]);

	// Monitor token status changes
	useEffect(() => {
		const checkToken = () => {
			setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
		};

		const interval = setInterval(checkToken, 30000); // Check every 30 seconds
		checkToken();

		return () => clearInterval(interval);
	}, []);

	// Monitor API display visibility
	useEffect(() => {
		const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
			setIsApiDisplayVisible(visible);
		});

		return () => unsubscribe();
	}, []);

	// Handle proceed to registration
	const handleProceedToRegistration = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();

		if (!selectedDeviceAuthPolicy) {
			toastV8.warning('Please select a Device Authentication Policy before proceeding');
			return;
		}
		
		if (!tokenStatus.isValid) {
			toastV8.warning('Please generate a worker token before proceeding');
			return;
		}
		
		console.log(`${MODULE_TAG} Proceeding to registration with policy:`, selectedDeviceAuthPolicy.id);
		
		// Navigate to actual TOTP registration flow
		navigate('/v8/mfa/register/totp/device', {
			replace: false,
			state: {
				deviceAuthenticationPolicyId: selectedDeviceAuthPolicy.id,
				policyName: selectedDeviceAuthPolicy.name,
				configured: true, // Flag to indicate configuration is complete
			},
		});
	}, [navigate, selectedDeviceAuthPolicy, tokenStatus.isValid]);

	return (
		<div style={{ minHeight: '100vh', background: '#f9fafb' }}>
			<MFANavigationV8 currentPage="registration" showBackToMain={true} />
			
			{/* API Display Toggle - Top */}
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 24px 20px', display: 'flex', justifyContent: 'flex-end' }}>
				<ApiDisplayCheckbox />
			</div>
			
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

				{/* Worker Token Section */}
				{!tokenStatus.isValid && (
					<div
						style={{
							background: 'white',
							borderRadius: '8px',
							padding: '24px',
							marginBottom: '24px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
							border: '1px solid #fecaca',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
							<FiInfo size={24} color="#dc2626" />
							<h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#991b1b' }}>
								Worker Token Required
							</h3>
						</div>
						<p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
							A worker token is required to register TOTP devices and manage MFA policies.
						</p>
						<button
							type="button"
							onClick={() => setShowWorkerTokenModal(true)}
							style={{
								padding: '10px 20px',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
							}}
						>
							Generate Worker Token
						</button>
					</div>
				)}

				{/* Education Section */}
				<div
					style={{
						background: 'white',
						borderRadius: '8px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
						<FiBook size={24} color="#f59e0b" />
						<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
							About TOTP Authentication
						</h2>
					</div>
					<div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
						<p style={{ margin: '0 0 12px 0' }}>
							<strong>TOTP (Time-based One-Time Password)</strong> authentication uses authenticator apps to generate time-based codes.
						</p>
						<ul style={{ margin: '0 0 12px 0', paddingLeft: '20px' }}>
							<li>Secure: Codes change every 30 seconds and are unique to your device</li>
							<li>Offline: Works without internet connection once set up</li>
							<li>Popular apps: Google Authenticator, Microsoft Authenticator, Authy, and more</li>
							<li>QR Code: Easy setup by scanning a QR code with your authenticator app</li>
						</ul>
						<p style={{ margin: 0 }}>
							After registering, you'll scan a QR code with your authenticator app and use the generated codes for authentication.
						</p>
					</div>
				</div>

				{/* Policy Selection */}
				{tokenStatus.isValid && environmentId && (
					<div
						style={{
							background: 'white',
							borderRadius: '8px',
							padding: '24px',
							marginBottom: '24px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
								<FiSettings size={24} color="#f59e0b" />
								<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
									Device Authentication Policy
								</h2>
								<MFAInfoButtonV8 contentKey="policy.deviceAuthentication" displayMode="modal" />
							</div>
							<button
								type="button"
								onClick={() => void loadPolicies()}
								disabled={isLoadingPolicies}
								style={{
									padding: '8px 16px',
									background: '#0284c7',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '13px',
									fontWeight: '600',
									cursor: isLoadingPolicies ? 'not-allowed' : 'pointer',
									opacity: isLoadingPolicies ? 0.6 : 1,
								}}
							>
								{isLoadingPolicies ? 'Loading...' : 'Refresh Policies'}
							</button>
						</div>

						{policiesError && (
							<div
								style={{
									background: '#fef2f2',
									border: '1px solid #fecaca',
									borderRadius: '6px',
									padding: '12px',
									marginBottom: '16px',
									color: '#991b1b',
									fontSize: '14px',
								}}
							>
								<strong>Error:</strong> {policiesError}
							</div>
						)}

						{deviceAuthPolicies.length > 0 && (
							<div>
								<label
									htmlFor="device-auth-policy-select"
									style={{
										display: 'block',
										marginBottom: '8px',
										fontSize: '14px',
										fontWeight: '600',
										color: '#374151',
									}}
								>
									Select Policy <span style={{ color: '#dc2626' }}>*</span>
								</label>
								<select
									id="device-auth-policy-select"
									value={selectedDeviceAuthPolicy?.id || ''}
									onChange={(e) => {
										const policy = deviceAuthPolicies.find((p) => p.id === e.target.value);
										setSelectedDeviceAuthPolicy(policy || null);
									}}
									style={{
										width: '100%',
										padding: '10px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '14px',
										background: 'white',
									}}
								>
									<option value="">-- Select a policy --</option>
									{deviceAuthPolicies.map((policy) => (
										<option key={policy.id} value={policy.id}>
											{policy.name} {policy.default ? '(Default)' : ''}
										</option>
									))}
								</select>
								{selectedDeviceAuthPolicy && (
									<div style={{ marginTop: '12px' }}>
										<p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
											{selectedDeviceAuthPolicy.description || 'No description available'}
										</p>
									</div>
								)}
							</div>
						)}
					</div>
				)}

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
						disabled={!selectedDeviceAuthPolicy || !tokenStatus.isValid}
						style={{
							padding: '12px 24px',
							border: 'none',
							borderRadius: '6px',
							background: selectedDeviceAuthPolicy && tokenStatus.isValid ? '#f59e0b' : '#9ca3af',
							color: 'white',
							fontSize: '16px',
							fontWeight: '600',
							cursor: selectedDeviceAuthPolicy && tokenStatus.isValid ? 'pointer' : 'not-allowed',
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

			{/* Worker Token Modal */}
			{showWorkerTokenModal && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => {
						setShowWorkerTokenModal(false);
						setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
					}}
				/>
			)}
			
			{/* API Display Toggle - Bottom */}
			<div style={{ maxWidth: '1200px', margin: '32px auto 0 auto', padding: '0 20px', display: 'flex', justifyContent: 'flex-end' }}>
				<ApiDisplayCheckbox />
			</div>
		</div>
	);
};

