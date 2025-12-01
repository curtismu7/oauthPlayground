/**
 * @file FIDO2ConfigurationPageV8.tsx
 * @module v8/flows/types
 * @description FIDO2 Configuration and Education Page
 * @version 8.0.0
 *
 * This page provides:
 * - FIDO2/WebAuthn education and information
 * - FIDO Policy selection and management
 * - Device type information
 * - Configuration before device registration
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiKey, FiShield, FiInfo, FiArrowRight, FiSettings, FiBook, FiCheckCircle, FiX } from 'react-icons/fi';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { MFAEducationServiceV8 } from '@/v8/services/mfaEducationServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { FIDO2Service } from '@/services/fido2Service';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import type { DeviceAuthenticationPolicy } from '../shared/MFATypes';
import { ApiDisplayCheckbox, SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';

const MODULE_TAG = '[🔑 FIDO2-CONFIG-V8]';

export const FIDO2ConfigurationPageV8: React.FC = () => {
	const navigate = useNavigate();
	
	// Environment and token state
	const [environmentId, setEnvironmentId] = useState<string>('');
	const [tokenStatus, setTokenStatus] = useState(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// WebAuthn support check
	const [webAuthnSupported, setWebAuthnSupported] = useState(false);
	const [enhancedCapabilities, setEnhancedCapabilities] = useState({
		webAuthnSupported: false,
		platformAuthenticator: false,
		crossPlatformAuthenticator: false,
		passkeySupport: false,
		conditionalUI: false,
	});

	// FIDO2 Policy state
	const [fido2Policies, setFido2Policies] = useState<Array<{
		id?: string;
		name: string;
		description?: string;
		default?: boolean;
		[key: string]: unknown;
	}>>([]);
	const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
	const [policiesError, setPoliciesError] = useState<string | null>(null);
	const [selectedFido2PolicyId, setSelectedFido2PolicyId] = useState<string>('');

	// Device Authentication Policy state
	const [deviceAuthPolicies, setDeviceAuthPolicies] = useState<DeviceAuthenticationPolicy[]>([]);
	const [isLoadingDeviceAuthPolicies, setIsLoadingDeviceAuthPolicies] = useState(false);
	const [deviceAuthPoliciesError, setDeviceAuthPoliciesError] = useState<string | null>(null);
	const [selectedDeviceAuthPolicy, setSelectedDeviceAuthPolicy] = useState<DeviceAuthenticationPolicy | null>(null);

	// API Display visibility state (for padding adjustment)
	const [isApiDisplayVisible, setIsApiDisplayVisible] = useState(apiDisplayServiceV8.isVisible());

	// Education content
	const webauthnContent = MFAEducationServiceV8.getContent('fido2.webauthn');
	const authenticatorContent = MFAEducationServiceV8.getContent('fido2.authenticator');
	const publicKeyContent = MFAEducationServiceV8.getContent('fido2.publicKey');
	const phishingContent = MFAEducationServiceV8.getContent('security.phishingResistance');

	// Load environment ID
	useEffect(() => {
		const envId = EnvironmentIdServiceV8.getEnvironmentId();
		if (envId) {
			setEnvironmentId(envId);
		}
	}, []);

	// Check WebAuthn support
	useEffect(() => {
		const initializeWebAuthn = async () => {
			const supported = FIDO2Service.isWebAuthnSupported();
			setWebAuthnSupported(supported);
			
			if (supported) {
				// Get basic capabilities first
				const capabilities = FIDO2Service.getCapabilities();
				
				// Check platform authenticator availability asynchronously
				try {
					const platformAvailable = await FIDO2Service.isPlatformAuthenticatorAvailable();
					// Adapt FIDO2Service capabilities to match expected structure
					setEnhancedCapabilities({
						webAuthnSupported: capabilities.webAuthnSupported,
						platformAuthenticator: platformAvailable,
						crossPlatformAuthenticator: capabilities.crossPlatformAuthenticator,
						passkeySupport: platformAvailable || capabilities.crossPlatformAuthenticator,
						conditionalUI: false, // Conditional UI detection would require additional checks
					});
				} catch (error) {
					console.warn('Failed to check platform authenticator availability:', error);
					// Fallback to basic capabilities
					setEnhancedCapabilities({
						webAuthnSupported: capabilities.webAuthnSupported,
						platformAuthenticator: capabilities.platformAuthenticator,
						crossPlatformAuthenticator: capabilities.crossPlatformAuthenticator,
						passkeySupport: capabilities.platformAuthenticator || capabilities.crossPlatformAuthenticator,
						conditionalUI: false,
					});
				}
			}
		};

		initializeWebAuthn();
	}, []);

	// Load FIDO2 policies
	useEffect(() => {
		const loadFido2Policies = async () => {
			if (!environmentId || !tokenStatus.isValid) {
				return;
			}

			setIsLoadingPolicies(true);
			setPoliciesError(null);

			try {
				const workerToken = await workerTokenServiceV8.getToken();
				if (!workerToken) {
					throw new Error('Worker token not found');
				}

				const credentialsData = await workerTokenServiceV8.loadCredentials();
				const region = credentialsData?.region || 'na';

				const params = new URLSearchParams({
					environmentId,
					workerToken: workerToken.trim(),
					region,
				});

				const response = await fetch(`/api/pingone/mfa/fido2-policies?${params.toString()}`, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
					throw new Error(errorData.message || errorData.error || `Failed to load FIDO2 policies: ${response.status}`);
				}

				const data = await response.json();
				const policiesList = data._embedded?.fido2Policies || [];
				setFido2Policies(policiesList);

				// Auto-select default policy
				if (policiesList.length > 0) {
					const defaultPolicy = policiesList.find((p: { default?: boolean }) => p.default) || policiesList[0];
					if (defaultPolicy.id) {
						setSelectedFido2PolicyId(defaultPolicy.id);
					}
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load FIDO2 policies';
				setPoliciesError(errorMessage);
				console.error(`${MODULE_TAG} Failed to load FIDO2 policies:`, error);
			} finally {
				setIsLoadingPolicies(false);
			}
		};

		void loadFido2Policies();
	}, [environmentId, tokenStatus.isValid]);

	// Load Device Authentication Policies
	useEffect(() => {
		const loadDeviceAuthPolicies = async () => {
			if (!environmentId || !tokenStatus.isValid) {
				return;
			}

			setIsLoadingDeviceAuthPolicies(true);
			setDeviceAuthPoliciesError(null);

			try {
				const policies = await MFAServiceV8.listDeviceAuthenticationPolicies(environmentId);
				setDeviceAuthPolicies(policies);

				// Auto-select default or first policy
				if (policies.length > 0) {
					const defaultPolicy = policies.find((p) => p.default) || policies[0];
					setSelectedDeviceAuthPolicy(defaultPolicy);
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to load device authentication policies';
				setDeviceAuthPoliciesError(errorMessage);
				console.error(`${MODULE_TAG} Failed to load device authentication policies:`, error);
			} finally {
				setIsLoadingDeviceAuthPolicies(false);
			}
		};

		void loadDeviceAuthPolicies();
	}, [environmentId, tokenStatus.isValid]);

	// Subscribe to API display visibility changes
	useEffect(() => {
		const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
			setIsApiDisplayVisible(visible);
		});
		return () => unsubscribe();
	}, []);

	// Handle proceed to registration
	const handleProceedToRegistration = useCallback(() => {
		if (!selectedFido2PolicyId) {
			toastV8.warning('Please select a FIDO2 policy before proceeding');
			return;
		}
		
		if (!tokenStatus.isValid) {
			toastV8.warning('Please generate a worker token before proceeding');
			return;
		}
		
		console.log(`${MODULE_TAG} Proceeding to registration with policy:`, selectedFido2PolicyId);
		
		// Navigate to actual registration flow with policy ID in state
		// Use a different route for the actual registration flow
		navigate('/v8/mfa/register/fido2/device', {
			replace: false,
			state: {
				fido2PolicyId: selectedFido2PolicyId,
				deviceAuthPolicyId: selectedDeviceAuthPolicy?.id,
				configured: true, // Flag to indicate configuration is complete
			},
		});
	}, [navigate, selectedFido2PolicyId, selectedDeviceAuthPolicy, tokenStatus.isValid]);

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
				paddingBottom: isApiDisplayVisible ? '450px' : '32px', // Add extra padding when API display is visible
				transition: 'padding-bottom 0.3s ease',
			}}>
				{/* Header */}
				<div
					style={{
						background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
						borderRadius: '12px',
						padding: '32px',
						marginBottom: '32px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
						<FiKey size={32} color="white" />
						<h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'white' }}>
							FIDO2 / WebAuthn Configuration
						</h1>
					</div>
					<p style={{ margin: 0, fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)' }}>
						Configure FIDO2 policies, learn about WebAuthn, and prepare for device registration
					</p>
				</div>

				{/* WebAuthn Support Check */}
				{!webAuthnSupported && (
					<div
						style={{
							background: '#fef2f2',
							border: '1px solid #fecaca',
							borderRadius: '8px',
							padding: '16px',
							marginBottom: '24px',
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
						}}
					>
						<FiInfo size={20} color="#dc2626" />
						<div>
							<p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#991b1b' }}>
								WebAuthn Not Supported
							</p>
							<p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#7f1d1d' }}>
								Your browser does not support WebAuthn. Please use a modern browser like Chrome, Firefox, Safari, or Edge.
							</p>
						</div>
					</div>
				)}

				{/* Worker Token Section */}
				{!tokenStatus.isValid && (
					<div
						style={{
							background: 'white',
							borderRadius: '8px',
							padding: '24px',
							marginBottom: '24px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						}}
					>
						<h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600' }}>
							Worker Token Required
						</h3>
						<p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
							You need a valid worker token to configure FIDO2 policies and register devices.
						</p>
						<button
							type="button"
							onClick={() => setShowWorkerTokenModal(true)}
							style={{
								padding: '10px 20px',
								border: 'none',
								borderRadius: '6px',
								background: '#3b82f6',
								color: 'white',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
							}}
						>
							Get Worker Token
						</button>
					</div>
				)}

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
					{/* FIDO2 Education */}
					<div
						style={{
							background: 'white',
							borderRadius: '8px',
							padding: '24px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
							<FiBook size={20} color="#3b82f6" />
							<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>About FIDO2 & WebAuthn</h2>
						</div>

						<div style={{ marginBottom: '20px' }}>
							<h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
								{webauthnContent.title}
								<MFAInfoButtonV8 contentKey="fido2.webauthn" displayMode="tooltip" />
							</h3>
							<p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
								{webauthnContent.description}
							</p>
						</div>

						<div style={{ marginBottom: '20px' }}>
							<h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
								{authenticatorContent.title}
								<MFAInfoButtonV8 contentKey="fido2.authenticator" displayMode="tooltip" />
							</h3>
							<p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
								{authenticatorContent.description}
							</p>
						</div>

						<div style={{ marginBottom: '20px' }}>
							<h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
								{publicKeyContent.title}
								<MFAInfoButtonV8 contentKey="fido2.publicKey" displayMode="tooltip" />
							</h3>
							<p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
								{publicKeyContent.description}
							</p>
							{publicKeyContent.securityNote && (
								<p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#10b981', fontWeight: '500' }}>
									🔒 {publicKeyContent.securityNote}
								</p>
							)}
						</div>

						<div
							style={{
								background: '#f0fdf4',
								border: '1px solid #bbf7d0',
								borderRadius: '6px',
								padding: '12px',
								marginTop: '20px',
							}}
						>
							<h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#166534' }}>
								{phishingContent.title}
							</h3>
							<p style={{ margin: 0, fontSize: '13px', color: '#166534', lineHeight: '1.5' }}>
								{phishingContent.description}
							</p>
						</div>
					</div>

					{/* WebAuthn Capabilities */}
					{webAuthnSupported && (
						<div
							style={{
								background: 'white',
								borderRadius: '8px',
								padding: '24px',
								boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
								<FiCheckCircle size={20} color="#10b981" />
								<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Browser Capabilities</h2>
							</div>

							<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									{enhancedCapabilities.platformAuthenticator ? (
										<FiCheckCircle size={16} color="#10b981" />
									) : (
										<FiX size={16} color="#ef4444" />
									)}
									<span style={{ fontSize: '14px' }}>Platform Authenticator (Touch ID, Face ID, Windows Hello)</span>
								</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									{enhancedCapabilities.crossPlatformAuthenticator ? (
										<FiCheckCircle size={16} color="#10b981" />
									) : (
										<FiX size={16} color="#ef4444" />
									)}
									<span style={{ fontSize: '14px' }}>Cross-Platform Authenticator (Security Keys)</span>
								</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									{enhancedCapabilities.passkeySupport ? (
										<FiCheckCircle size={16} color="#10b981" />
									) : (
										<FiX size={16} color="#ef4444" />
									)}
									<span style={{ fontSize: '14px' }}>Passkey Support</span>
								</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									{enhancedCapabilities.conditionalUI ? (
										<FiCheckCircle size={16} color="#10b981" />
									) : (
										<FiX size={16} color="#ef4444" />
									)}
									<span style={{ fontSize: '14px' }}>Conditional UI (Autofill)</span>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Policy Selection */}
				{tokenStatus.isValid && (
					<div
						style={{
							background: 'white',
							borderRadius: '8px',
							padding: '24px',
							marginBottom: '24px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
							<FiSettings size={20} color="#3b82f6" />
							<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>FIDO2 Policy Configuration</h2>
						</div>

						{isLoadingPolicies ? (
							<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Loading policies...</p>
						) : policiesError ? (
							<div
								style={{
									background: '#fef2f2',
									border: '1px solid #fecaca',
									borderRadius: '6px',
									padding: '12px',
									marginBottom: '16px',
								}}
							>
								<p style={{ margin: 0, fontSize: '14px', color: '#991b1b' }}>{policiesError}</p>
							</div>
						) : fido2Policies.length === 0 ? (
							<div
								style={{
									background: '#fffbeb',
									border: '1px solid #fde68a',
									borderRadius: '6px',
									padding: '12px',
									marginBottom: '16px',
								}}
							>
								<p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
									No FIDO2 policies found. Create one in the{' '}
									<button
										type="button"
										onClick={() => navigate('/v8/mfa-fido-policies')}
										style={{
											background: 'none',
											border: 'none',
											color: '#3b82f6',
											textDecoration: 'underline',
											cursor: 'pointer',
											fontSize: '14px',
										}}
									>
										FIDO Policy Management
									</button>{' '}
									page.
								</p>
							</div>
						) : (
							<div>
								<label
									htmlFor="fido2-policy-select"
									style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}
								>
									Select FIDO2 Policy:
								</label>
								<select
									id="fido2-policy-select"
									value={selectedFido2PolicyId}
									onChange={(e) => setSelectedFido2PolicyId(e.target.value)}
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
									{fido2Policies.map((policy) => (
										<option key={policy.id} value={policy.id}>
											{policy.name} {policy.default ? '(Default)' : ''}
										</option>
									))}
								</select>
								{selectedFido2PolicyId && (
									<div style={{ marginTop: '12px' }}>
										{fido2Policies
											.find((p) => p.id === selectedFido2PolicyId)
											?.description && (
											<p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
												{fido2Policies.find((p) => p.id === selectedFido2PolicyId)?.description}
											</p>
										)}
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{/* Device Authentication Policy */}
				{tokenStatus.isValid && (
					<div
						style={{
							background: 'white',
							borderRadius: '8px',
							padding: '24px',
							marginBottom: '24px',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
							<FiShield size={20} color="#3b82f6" />
							<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Device Authentication Policy</h2>
						</div>

						{isLoadingDeviceAuthPolicies ? (
							<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Loading policies...</p>
						) : deviceAuthPoliciesError ? (
							<div
								style={{
									background: '#fef2f2',
									border: '1px solid #fecaca',
									borderRadius: '6px',
									padding: '12px',
								}}
							>
								<p style={{ margin: 0, fontSize: '14px', color: '#991b1b' }}>{deviceAuthPoliciesError}</p>
							</div>
						) : deviceAuthPolicies.length === 0 ? (
							<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
								No device authentication policies found.
							</p>
						) : (
							<div>
								<label
									htmlFor="device-auth-policy-select"
									style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}
								>
									Select Device Authentication Policy:
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
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							console.log(`${MODULE_TAG} Button clicked`, {
								selectedFido2PolicyId,
								tokenStatusValid: tokenStatus.isValid,
								disabled: !selectedFido2PolicyId || !tokenStatus.isValid,
							});
							handleProceedToRegistration();
						}}
						disabled={!selectedFido2PolicyId || !tokenStatus.isValid}
						style={{
							padding: '12px 24px',
							border: 'none',
							borderRadius: '6px',
							background: selectedFido2PolicyId && tokenStatus.isValid ? '#3b82f6' : '#9ca3af',
							color: 'white',
							fontSize: '16px',
							fontWeight: '600',
							cursor: selectedFido2PolicyId && tokenStatus.isValid ? 'pointer' : 'not-allowed',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						Proceed to Device Registration
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

