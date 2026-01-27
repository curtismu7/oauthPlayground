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
import { FiArrowRight, FiBook, FiClock } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/NewAuthContext';
import { MFANavigationV8 } from '@/v8/components/MFANavigationV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { UserLoginModalV8 } from '@/v8/components/UserLoginModalV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { OAuthIntegrationServiceV8 } from '@/v8/services/oauthIntegrationServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { navigateToMfaHubWithCleanup } from '@/v8/utils/mfaFlowCleanupV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';


{/* Clean Worker Token Section - Always show */
					<p style={{ margin: 0, fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)' }}>
						Configure TOTP device registration, learn about authenticator apps, and prepare for
						device setup
					</p>
				</div>

				{/* Registration Flow Type Selection - TOTP specific */}
				<div
					style={{
						background: 'white',
						borderRadius: '8px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					{/* biome-ignore lint/a11y/noLabelWithoutControl: Label is for visual grouping, inputs are inside */}
					<label
						style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '16px',
						}}
					>
						Registration Flow Type <span style={{ color: '#dc2626' }}>*</span>
					</label>
					<div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button selection, keyboard handled by input */}
						<label
							style={{
								flex: 1,
								padding: '16px',
								border: `2px solid ${registrationFlowType === 'admin' ? '#3b82f6' : '#d1d5db'}`,
								borderRadius: '8px',
								background: registrationFlowType === 'admin' ? '#eff6ff' : 'white',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
							}}
							onClick={() => setRegistrationFlowType('admin')}
						>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
							>
								<input
									type="radio"
									name="registration-flow-type"
									value="admin"
									checked={registrationFlowType === 'admin'}
									onChange={() => setRegistrationFlowType('admin')}
									style={{ margin: 0, cursor: 'pointer', width: '18px', height: '18px' }}
								/>
								<div style={{ flex: 1 }}>
									<span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
										Admin Flow
									</span>
									<div
										style={{
											fontSize: '12px',
											color: '#6b7280',
											marginTop: '2px',
											fontStyle: 'italic',
										}}
									>
										Using worker token
									</div>
								</div>
							</div>
							{/* Device status options for Admin Flow */}
							<div
								style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}
							>
								<div
									style={{
										fontSize: '13px',
										fontWeight: '600',
										color: '#374151',
										marginBottom: '8px',
									}}
								>
									Device Status:
								</div>
								<div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
									{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button selection, keyboard handled by input */}
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											padding: '8px 12px',
											border: `1px solid ${adminDeviceStatus === 'ACTIVE' ? '#10b981' : '#d1d5db'}`,
											borderRadius: '6px',
											background: adminDeviceStatus === 'ACTIVE' ? '#f0fdf4' : 'white',
											cursor: registrationFlowType === 'admin' ? 'pointer' : 'default',
											transition: 'all 0.2s ease',
											opacity: registrationFlowType === 'admin' ? 1 : 0.7,
										}}
										onClick={(e) => {
											e.stopPropagation();
											if (registrationFlowType === 'admin') {
												setAdminDeviceStatus('ACTIVE');
											}
										}}
									>
										<input
											type="radio"
											name="admin-device-status"
											value="ACTIVE"
											checked={adminDeviceStatus === 'ACTIVE'}
											onChange={() => {
												if (registrationFlowType === 'admin') {
													setAdminDeviceStatus('ACTIVE');
												}
											}}
											onClick={(e) => e.stopPropagation()}
											disabled={registrationFlowType !== 'admin'}
											style={{
												margin: 0,
												cursor: registrationFlowType === 'admin' ? 'pointer' : 'not-allowed',
												width: '16px',
												height: '16px',
											}}
										/>
										<span style={{ fontSize: '13px', color: '#374151' }}>
											<strong>ACTIVE</strong> - Device created as ready to use, no activation needed
										</span>
									</label>
									{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button selection, keyboard handled by input */}
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											padding: '8px 12px',
											border: `1px solid ${adminDeviceStatus === 'ACTIVATION_REQUIRED' ? '#f59e0b' : '#d1d5db'}`,
											borderRadius: '6px',
											background: adminDeviceStatus === 'ACTIVATION_REQUIRED' ? '#fffbeb' : 'white',
											cursor: registrationFlowType === 'admin' ? 'pointer' : 'default',
											transition: 'all 0.2s ease',
											opacity: registrationFlowType === 'admin' ? 1 : 0.7,
										}}
										onClick={(e) => {
											e.stopPropagation();
											if (registrationFlowType === 'admin') {
												setAdminDeviceStatus('ACTIVATION_REQUIRED');
											}
										}}
									>
										<input
											type="radio"
											name="admin-device-status"
											value="ACTIVATION_REQUIRED"
											checked={adminDeviceStatus === 'ACTIVATION_REQUIRED'}
											onChange={() => {
												if (registrationFlowType === 'admin') {
													setAdminDeviceStatus('ACTIVATION_REQUIRED');
												}
											}}
											onClick={(e) => e.stopPropagation()}
											disabled={registrationFlowType !== 'admin'}
											style={{
												margin: 0,
												cursor: registrationFlowType === 'admin' ? 'pointer' : 'not-allowed',
												width: '16px',
												height: '16px',
											}}
										/>
										<span style={{ fontSize: '13px', color: '#374151' }}>
											<strong>ACTIVATION_REQUIRED</strong> - OTP will be sent for device activation
										</span>
									</label>
								</div>
							</div>
						</label>
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: Radio button selection, keyboard handled by input */}
						<label
							style={{
								flex: 1,
								padding: '16px',
								border: `2px solid ${registrationFlowType === 'user' ? '#3b82f6' : '#d1d5db'}`,
								borderRadius: '8px',
								background: registrationFlowType === 'user' ? '#eff6ff' : 'white',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
							}}
							onClick={() => setRegistrationFlowType('user')}
						>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
							>
								<input
									type="radio"
									name="registration-flow-type"
									value="user"
									checked={registrationFlowType === 'user'}
									onChange={() => setRegistrationFlowType('user')}
									style={{ margin: 0, cursor: 'pointer', width: '18px', height: '18px' }}
								/>
								<div style={{ flex: 1 }}>
									<span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
										User Flow
									</span>
									<div
										style={{
											fontSize: '12px',
											color: '#6b7280',
											marginTop: '2px',
											fontStyle: 'italic',
										}}
									>
										Using access token from User Authentication
									</div>
								</div>
							</div>
							<div
								style={{
									fontSize: '13px',
									color: '#6b7280',
									marginLeft: '28px',
									lineHeight: '1.5',
									padding: '8px 12px',
									background: '#f9fafb',
									borderRadius: '6px',
									border: '1px solid #e5e7eb',
								}}
							>
								<strong style={{ color: '#f59e0b' }}>ACTIVATION_REQUIRED</strong> - OTP will be sent
								for device activation
							</div>
						</label>
					</div>
					<small
						style={{
							display: 'block',
							marginTop: '12px',
							fontSize: '12px',
							color: '#6b7280',
							lineHeight: '1.5',
						}}
					>
						Admin Flow allows choosing device status (ACTIVE or ACTIVATION_REQUIRED). User Flow
						always requires activation.
					</small>
				</div>

				{/* Shared Configuration Step */}
				<div
					style={{
						background: 'white',
						borderRadius: '8px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>


{/* Clean Worker Token Section - Always show */

				{/* Clean Worker Token Section - Always show */}
				<WorkerTokenSectionV8
					environmentId={credentials.environmentId}
					onTokenUpdated={(token) => {
						// Update credentials when worker token is generated
						setCredentials(prev => ({
							...prev,
							workerToken: token,
							tokenType: 'worker' as const,
						}));
					}}
					compact={false}
					showSettings={true}
				/>

				{/* Clean User Login Section - Only show for user flow */}
				{registrationFlowType === 'user' && (
					<UserLoginSectionV8
						onTokenUpdated={(token) => {
							// Update credentials when user token is received
							setCredentials(prev => ({
								...prev,
								userToken: token,
								tokenType: 'user' as const,
							}));
						}}
						compact={false}
						showUserInfo={true}
					/>
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
						<FiBook size={24} color="#3b82f6" />
						<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
							About OATH TOTP (RFC 6238)
						</h2>
					</div>
					<div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
						<p style={{ margin: '0 0 12px 0' }}>
							<strong>OATH TOTP (Time-based One-Time Password, RFC 6238)</strong> is an open
							standard for generating time-based authentication codes using authenticator apps like
							Google Authenticator, Authy, or Microsoft Authenticator.
						</p>
						<ul style={{ margin: '0 0 12px 0', paddingLeft: '20px' }}>
							<li>
								<strong>Phishing-resistant:</strong> Codes are generated locally on your device,
								making them immune to SMS interception attacks
							</li>
							<li>
								<strong>Offline-capable:</strong> Doesn't rely on network connectivity - codes are
								generated using time-based algorithms
							</li>
							<li>
								<strong>Time-based:</strong> Each 6-digit code is valid for 30 seconds,
								automatically rotating for enhanced security
							</li>
							<li>
								<strong>Industry standard:</strong> Based on RFC 6238, ensuring compatibility across
								different authenticator apps
							</li>
							<li>
								<strong>Secure storage:</strong> Secret keys are stored securely in your
								authenticator app and never transmitted
							</li>
							<li>
								<strong>Easy setup:</strong> Simple QR code scan or manual secret key entry to get
								started
							</li>
						</ul>
						<p style={{ margin: '0 0 12px 0' }}>
							<strong>How it works:</strong> After registering your TOTP device, you'll receive a QR
							code containing your secret key. Scan this QR code with an authenticator app to set up
							OATH TOTP (RFC 6238). The app will then generate time-based codes that you enter when
							authenticating.
						</p>
						<p
							style={{
								margin: 0,
								padding: '12px',
								background: '#f0f9ff',
								borderRadius: '6px',
								border: '1px solid #bfdbfe',
							}}
						>
							<strong>📚 Learn more:</strong> OATH TOTP (RFC 6238) is part of the Initiative for
							Open Authentication (OATH) framework, providing a standardized approach to two-factor
							authentication. The standard ensures codes are generated using HMAC-SHA1 algorithm
							with time-based intervals, making it highly secure and widely compatible.
						</p>
					</div>
				</div>

				{/* Proceed Button */}
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
					<button
						type="button"
						onClick={() => navigateToMfaHubWithCleanup(navigate)}
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
							!(credentials.tokenType === 'worker'
								? tokenStatus.isValid
								: !!credentials.userToken?.trim())
						}
						style={{
							padding: '12px 24px',
							border: 'none',
							borderRadius: '6px',
							background:
								credentials.environmentId?.trim() &&
								credentials.username?.trim() &&
								credentials.deviceAuthenticationPolicyId?.trim() &&
								(credentials.tokenType === 'worker'
									? tokenStatus.isValid
									: !!credentials.userToken?.trim())
									? '#f59e0b'
									: '#9ca3af',
							color: 'white',
							fontSize: '16px',
							fontWeight: '600',
							cursor:
								credentials.environmentId?.trim() &&
								credentials.username?.trim() &&
								credentials.deviceAuthenticationPolicyId?.trim() &&
								(credentials.tokenType === 'worker'
									? tokenStatus.isValid
									: !!credentials.userToken?.trim())
									? 'pointer'
									: 'not-allowed',
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
			{showWorkerTokenModal &&
				(() => {
					// Check if we should show token only (matches MFA pattern)
					try {
						const {
							MFAConfigurationServiceV8,
						} = require('@/v8/services/mfaConfigurationServiceV8');
						const config = MFAConfigurationServiceV8.loadConfiguration();
						const tokenStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();

						// Show token-only if showTokenAtEnd is ON and token is valid
						const showTokenOnly = config.workerToken.showTokenAtEnd && tokenStatus.isValid;

						return (
							<WorkerTokenModalV8
								isOpen={showWorkerTokenModal}
								onClose={() => {
									setShowWorkerTokenModal(false);
									setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
								}}
								showTokenOnly={showTokenOnly}
							/>
						);
					} catch {
						return (
							<WorkerTokenModalV8
								isOpen={showWorkerTokenModal}
								onClose={() => {
									setShowWorkerTokenModal(false);
									setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
								}}
							/>
						);
					}
				})()}
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
