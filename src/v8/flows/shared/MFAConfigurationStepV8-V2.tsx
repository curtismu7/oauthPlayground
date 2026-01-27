/**
 * @file MFAConfigurationStepV8-V2.tsx
 * @module v8/flows/shared
 * @description Cleaner version of MFA Configuration Step with collapsible token sections
 * @version 8.4.0
 *
 * Improvements over V1:
 * - Cleaner, more maintainable structure
 * - Collapsible token sections for admin and user flows
 * - Simplified state management
 * - Better separation of concerns
 */

import React, { useEffect, useState } from 'react';
import { MFAInfoButtonV8 } from '@/v8/components/MFAInfoButtonV8';
import { WorkerTokenStatusDisplayV8 } from '@/v8/components/WorkerTokenStatusDisplayV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import type { MFAFlowBaseRenderProps } from './MFAFlowBaseV8';
import type { DeviceType } from './MFATypes';

interface MFAConfigurationStepV8Props extends MFAFlowBaseRenderProps {
	deviceType: DeviceType;
	deviceTypeLabel: string;
	policyDescription?: string;
	registrationFlowType?: 'admin' | 'user';
}

export const MFAConfigurationStepV8V2: React.FC<MFAConfigurationStepV8Props> = ({
	credentials,
	setCredentials,
	tokenStatus,
	deviceAuthPolicies,
	isLoadingPolicies,
	policiesError,
	refreshDeviceAuthPolicies,
	deviceTypeLabel,
	policyDescription,
	registrationFlowType,
}) => {
	// Collapsible sections state
	const [showWorkerTokenSection, setShowWorkerTokenSection] = useState(true);
	const [showUserTokenSection, setShowUserTokenSection] = useState(true);

	// Worker token settings
	const [silentApiRetrieval, setSilentApiRetrieval] = useState(false);
	const [showTokenAtEnd, setShowTokenAtEnd] = useState(true);

	// User token state
	const userToken = credentials.userToken || '';

	// Load worker token settings from config on mount
	useEffect(() => {
		const loadSettings = async () => {
			try {
				const { MFAConfigurationServiceV8 } = await import(
					'@/v8/services/mfaConfigurationServiceV8'
				);
				const config = MFAConfigurationServiceV8.loadConfiguration();
				setSilentApiRetrieval(config.workerToken.silentApiRetrieval || false);
				setShowTokenAtEnd(config.workerToken.showTokenAtEnd !== false);
			} catch (error) {
				console.error('[MFA-CONFIG-V2] Failed to load settings:', error);
			}
		};
		loadSettings();
	}, []);

	// Auto-select first policy when policies load
	useEffect(() => {
		if (deviceAuthPolicies.length > 0 && !credentials.deviceAuthenticationPolicyId) {
			const firstPolicy = deviceAuthPolicies[0];
			console.log(`[MFA-CONFIG-V2] Auto-selecting policy: ${firstPolicy.name}`);
			setCredentials((prev) => ({
				...prev,
				deviceAuthenticationPolicyId: firstPolicy.id,
			}));
		}
	}, [deviceAuthPolicies, credentials.deviceAuthenticationPolicyId, setCredentials]);

	return (
		<>
			<style>{`
				@keyframes policy-refresh-spin {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
			`}</style>

			<div className="step-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
				{/* Header */}
				<div style={{ marginBottom: '32px' }}>
					<h2
						style={{
							margin: '0 0 8px 0',
							fontSize: '24px',
							fontWeight: '700',
							color: '#111827',
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
						}}
					>
						Configure {deviceTypeLabel} MFA Settings
						<MFAInfoButtonV8 contentKey="device.enrollment" displayMode="modal" />
					</h2>
					<p style={{ margin: 0, fontSize: '15px', color: '#6b7280', lineHeight: '1.5' }}>
						Enter your PingOne environment details and user information
					</p>
				</div>

				{/* Flow Type Information */}
				<div
					style={{
						marginBottom: '28px',
						padding: '20px',
						background: '#f0f9ff',
						borderRadius: '8px',
						border: '1px solid #bae6fd',
					}}
				>
					<h3
						style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#1e40af' }}
					>
						Admin Flow vs User Flow
					</h3>
					<div style={{ fontSize: '14px', color: '#1e3a8a', lineHeight: '1.6' }}>
						<p style={{ margin: '0 0 12px 0' }}>
							<strong>Admin Flow:</strong> Uses a <strong>Worker Token</strong> (service account
							token) for administrative operations. Devices can be created as ACTIVE or
							ACTIVATION_REQUIRED.
						</p>
						<p style={{ margin: '0' }}>
							<strong>User Flow:</strong> Uses a <strong>User Token</strong> (access token from
							OAuth Authorization Code Flow) for user-initiated device registration. Devices are
							always created with ACTIVATION_REQUIRED status.
						</p>
					</div>
				</div>

				{/* Conditional Token Sections - Collapsible */}
				{/* Worker Token Section - Show for admin flows */}
				{registrationFlowType === 'admin' && (
					<div
						style={{
							marginBottom: '24px',
							background: '#ffffff',
							borderRadius: '8px',
							border: '1px solid #e5e7eb',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						}}
					>
						<button
							type="button"
							onClick={() => setShowWorkerTokenSection(!showWorkerTokenSection)}
							style={{
								width: '100%',
								padding: '20px',
								background: 'transparent',
								border: 'none',
								borderRadius: '8px',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								textAlign: 'left',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
								<span style={{ fontSize: '20px' }}>🔑</span>
								<div>
									<h3
										style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}
									>
										Worker Token
									</h3>
									<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
										Admin authentication using service account token
									</p>
								</div>
							</div>
							<span
								style={{
									fontSize: '18px',
									color: '#6b7280',
									transform: showWorkerTokenSection ? 'rotate(90deg)' : 'rotate(0deg)',
									transition: 'transform 0.3s ease',
								}}
							>
								›
							</span>
						</button>
						{showWorkerTokenSection && (
							<div style={{ padding: '0 20px 20px' }}>
								<WorkerTokenStatusDisplayV8 mode="compact" showRefresh={true} />
								<div
									style={{
										marginTop: '16px',
										display: 'flex',
										flexDirection: 'column',
										gap: '12px',
									}}
								>
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '12px',
											cursor: 'pointer',
											userSelect: 'none',
											padding: '8px',
											borderRadius: '6px',
											transition: 'background-color 0.2s ease',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor = '#f3f4f6';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = 'transparent';
										}}
									>
										<input
											type="checkbox"
											checked={silentApiRetrieval}
											onChange={async (e) => {
												const newValue = e.target.checked;
												setSilentApiRetrieval(newValue);
												const { MFAConfigurationServiceV8 } = await import(
													'@/v8/services/mfaConfigurationServiceV8'
												);
												const config = MFAConfigurationServiceV8.loadConfiguration();
												config.workerToken.silentApiRetrieval = newValue;
												MFAConfigurationServiceV8.saveConfiguration(config);
												window.dispatchEvent(
													new CustomEvent('mfaConfigurationUpdated', {
														detail: { workerToken: config.workerToken },
													})
												);
												toastV8.info(`Silent API Token Retrieval set to: ${newValue}`);
											}}
											style={{
												width: '20px',
												height: '20px',
												cursor: 'pointer',
												accentColor: '#6366f1',
												flexShrink: 0,
											}}
										/>
										<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
											<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
												Silent API Token Retrieval
											</span>
											<span style={{ fontSize: '12px', color: '#6b7280' }}>
												Automatically fetch worker token in the background without showing modals
											</span>
										</div>
									</label>
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '12px',
											cursor: 'pointer',
											userSelect: 'none',
											padding: '8px',
											borderRadius: '6px',
											transition: 'background-color 0.2s ease',
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor = '#f3f4f6';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = 'transparent';
										}}
									>
										<input
											type="checkbox"
											checked={showTokenAtEnd}
											onChange={async (e) => {
												const newValue = e.target.checked;
												setShowTokenAtEnd(newValue);
												const { MFAConfigurationServiceV8 } = await import(
													'@/v8/services/mfaConfigurationServiceV8'
												);
												const config = MFAConfigurationServiceV8.loadConfiguration();
												config.workerToken.showTokenAtEnd = newValue;
												MFAConfigurationServiceV8.saveConfiguration(config);
												window.dispatchEvent(
													new CustomEvent('mfaConfigurationUpdated', {
														detail: { workerToken: config.workerToken },
													})
												);
												toastV8.info(`Show Token at End set to: ${newValue}`);
											}}
											style={{
												width: '20px',
												height: '20px',
												cursor: 'pointer',
												accentColor: '#6366f1',
												flexShrink: 0,
											}}
										/>
										<div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
											<span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
												Show Token at End
											</span>
											<span style={{ fontSize: '12px', color: '#6b7280' }}>
												Display the complete worker token at the end of the configuration process
											</span>
										</div>
									</label>
								</div>
							</div>
						)}
					</div>
				)}

				{/* User Token Section - Show for user flows */}
				{registrationFlowType === 'user' && (
					<div
						style={{
							marginBottom: '24px',
							background: '#ffffff',
							borderRadius: '8px',
							border: '1px solid #e5e7eb',
							boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
						}}
					>
						<button
							type="button"
							onClick={() => setShowUserTokenSection(!showUserTokenSection)}
							style={{
								width: '100%',
								padding: '20px',
								background: 'transparent',
								border: 'none',
								borderRadius: '8px',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								textAlign: 'left',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
								<span style={{ fontSize: '20px' }}>👤</span>
								<div>
									<h3
										style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}
									>
										User Token
									</h3>
									<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
										User authentication using PingOne access token
									</p>
								</div>
							</div>
							<span
								style={{
									fontSize: '18px',
									color: '#6b7280',
									transform: showUserTokenSection ? 'rotate(90deg)' : 'rotate(0deg)',
									transition: 'transform 0.3s ease',
								}}
							>
								›
							</span>
						</button>
						{showUserTokenSection && (
							<div style={{ padding: '0 20px 20px' }}>
								<div
									style={{
										marginBottom: '16px',
										padding: '12px',
										background: userToken ? '#f0fdf4' : '#fef2f2',
										border: `1px solid ${userToken ? '#86efac' : '#fca5a5'}`,
										borderRadius: '6px',
									}}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											marginBottom: '8px',
										}}
									>
										<strong style={{ color: userToken ? '#166534' : '#dc2626' }}>
											Status: {userToken ? 'AVAILABLE' : 'MISSING'}
										</strong>
									</div>
									<p
										style={{
											margin: '0',
											fontSize: '13px',
											color: userToken ? '#15803d' : '#991b1b',
										}}
									>
										{userToken
											? 'PingOne access token is available for user authentication'
											: 'No PingOne access token - user authentication required'}
									</p>
									{userToken && (
										<p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
											Access Token Length: {userToken.length} characters
										</p>
									)}
								</div>
								<div
									style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}
								>
									<button
										type="button"
										onClick={() => {
											window.location.href = '/v8u/unified/oauth-authz/0';
										}}
										style={{
											flex: '1',
											minWidth: '160px',
											padding: '12px 20px',
											background: userToken ? '#10b981' : '#6366f1',
											color: 'white',
											border: 'none',
											borderRadius: '6px',
											fontSize: '14px',
											fontWeight: '600',
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											gap: '8px',
											transition: 'all 0.2s ease',
										}}
									>
										🔐 Login with PingOne
									</button>
									<button
										type="button"
										onClick={() => {
											setCredentials((prev) => ({ ...prev, userToken: '' }));
											toastV8.success('User token cleared');
										}}
										style={{
											flex: '1',
											minWidth: '120px',
											padding: '12px 20px',
											background: '#ef4444',
											color: 'white',
											border: 'none',
											borderRadius: '6px',
											fontSize: '14px',
											fontWeight: '600',
											cursor: 'pointer',
											transition: 'all 0.2s ease',
										}}
									>
										🗑️ Clear Token
									</button>
								</div>
								<div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>
									<p style={{ margin: '0 0 12px 0' }}>
										<strong>PingOne Access Token</strong> represents the authenticated user's
										identity and permissions obtained through the Authorization Code Flow.
									</p>
									<ul style={{ margin: '0', paddingLeft: '20px' }}>
										<li>Contains user identity claims (subject, name, email)</li>
										<li>Includes user permissions and scopes</li>
										<li>Required for user-based API calls</li>
									</ul>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Credentials Grid */}
				<div
					className="credentials-grid"
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
						gap: '24px',
						marginBottom: '24px',
					}}
				>
					{/* Environment ID */}
					<div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
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
								border: credentials.environmentId?.trim()
									? '1px solid #d1d5db'
									: '2px solid #ef4444',
								borderRadius: '6px',
								fontSize: '14px',
								background: credentials.environmentId?.trim() ? 'white' : '#fef2f2',
								color: '#111827',
								transition: 'border-color 0.2s ease',
							}}
							onFocus={(e) => {
								e.target.style.borderColor = '#3b82f6';
							}}
							onBlur={(e) => {
								e.target.style.borderColor = credentials.environmentId?.trim()
									? '#d1d5db'
									: '#ef4444';
							}}
						/>
						<small
							style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: '#6b7280' }}
						>
							PingOne environment ID
						</small>
					</div>

					{/* Region */}
					<div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
						<label
							htmlFor="mfa-region"
							style={{
								display: 'block',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
								marginBottom: '8px',
							}}
						>
							Region
						</label>
						<select
							id="mfa-region"
							value={credentials.region || 'us'}
							onChange={(e) =>
								setCredentials({
									...credentials,
									region: e.target.value as 'us' | 'eu' | 'ap' | 'ca' | 'na',
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
							onFocus={(e) => {
								e.target.style.borderColor = '#3b82f6';
							}}
							onBlur={(e) => {
								e.target.style.borderColor = '#d1d5db';
							}}
						>
							<option value="us">US (North America) - auth.pingone.com</option>
							<option value="eu">EU (Europe) - auth.pingone.eu</option>
							<option value="ap">AP (Asia Pacific) - auth.pingone.asia</option>
							<option value="ca">CA (Canada) - auth.pingone.ca</option>
						</select>
						<small
							style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: '#6b7280' }}
						>
							The region where your PingOne environment is hosted
						</small>
					</div>

					{/* Custom Domain */}
					<div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
						<label
							htmlFor="mfa-custom-domain"
							style={{
								display: 'block',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
								marginBottom: '8px',
							}}
						>
							Custom Domain (Optional)
						</label>
						<input
							id="mfa-custom-domain"
							type="text"
							value={credentials.customDomain || ''}
							onChange={(e) => {
								const value = e.target.value.trim();
								setCredentials({
									...credentials,
									customDomain: value || '',
								});
							}}
							placeholder="auth.yourcompany.com"
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
							onFocus={(e) => {
								e.target.style.borderColor = '#3b82f6';
							}}
							onBlur={(e) => {
								e.target.style.borderColor = '#d1d5db';
							}}
						/>
						<small
							style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: '#6b7280' }}
						>
							Your custom PingOne domain (e.g., auth.yourcompany.com). If set, this overrides the
							region-based domain.
						</small>
					</div>

					{/* Device Authentication Policy */}
					<div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: '8px',
							}}
						>
							<label
								htmlFor="mfa-device-auth-policy"
								style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151' }}
							>
								Device Authentication Policy <span style={{ color: '#dc2626' }}>*</span>
							</label>
							<button
								type="button"
								onClick={() => void refreshDeviceAuthPolicies()}
								style={{
									padding: '6px 14px',
									background: '#0284c7',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									fontSize: '12px',
									fontWeight: '600',
									cursor:
										isLoadingPolicies || !tokenStatus.isValid || !credentials.environmentId
											? 'not-allowed'
											: 'pointer',
									opacity:
										isLoadingPolicies || !tokenStatus.isValid || !credentials.environmentId
											? 0.6
											: 1,
									boxShadow: '0 2px 4px rgba(2,132,199,0.2)',
									transition: 'all 0.2s ease',
									display: 'flex',
									alignItems: 'center',
									gap: '6px',
								}}
								disabled={isLoadingPolicies || !tokenStatus.isValid || !credentials.environmentId}
							>
								{isLoadingPolicies && (
									<span
										style={{
											display: 'inline-block',
											width: '12px',
											height: '12px',
											border: '2px solid rgba(255, 255, 255, 0.3)',
											borderTop: '2px solid white',
											borderRadius: '50%',
											animation: 'policy-refresh-spin 0.8s linear infinite',
										}}
									/>
								)}
								{isLoadingPolicies ? 'Refreshing…' : 'Refresh'}
							</button>
						</div>

						{policiesError && (
							<div
								style={{
									padding: '12px',
									background: '#fef2f2',
									border: '1px solid #fecaca',
									borderRadius: '6px',
									color: '#991b1b',
									fontSize: '13px',
									marginBottom: '8px',
								}}
							>
								<strong>Failed to load policies:</strong> {policiesError}
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
								onFocus={(e) => {
									e.target.style.borderColor = '#3b82f6';
								}}
								onBlur={(e) => {
									e.target.style.borderColor = '#d1d5db';
								}}
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
								onFocus={(e) => {
									e.target.style.borderColor = '#3b82f6';
								}}
								onBlur={(e) => {
									e.target.style.borderColor = '#d1d5db';
								}}
							/>
						)}

						<small
							style={{
								display: 'block',
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
							{policyDescription ||
								`Determines which PingOne policy governs ${deviceTypeLabel} challenges.`}
						</small>
					</div>

					{/* Username */}
					<div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
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
								border: credentials.username?.trim() ? '1px solid #d1d5db' : '2px solid #ef4444',
								borderRadius: '6px',
								fontSize: '14px',
								background: credentials.username?.trim() ? 'white' : '#fef2f2',
								color: '#111827',
								transition: 'border-color 0.2s ease',
							}}
							onFocus={(e) => {
								e.target.style.borderColor = '#3b82f6';
							}}
							onBlur={(e) => {
								e.target.style.borderColor = credentials.username?.trim() ? '#d1d5db' : '#ef4444';
							}}
						/>
						<small
							style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: '#6b7280' }}
						>
							PingOne username to register MFA device for
						</small>
					</div>
				</div>
			</div>
		</>
	);
};
