/**
 * @file MFADeviceManagementFlowV8.tsx
 * @module v8/flows
 * @description MFA Device Management Flow - Manage user's MFA devices
 * @version 8.0.0
 * @since 2024-11-19
 * 
 * Features:
 * - View all MFA devices for a user
 * - Rename devices
 * - Block/Unblock devices
 * - Delete devices
 * 
 * @example
 * <MFADeviceManagementFlowV8 />
 */

import React, { useState, useEffect } from 'react';
import { MFADeviceManagerV8 } from '@/v8/components/MFADeviceManagerV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { SuperSimpleApiDisplayV8, ApiDisplayCheckbox } from '@/v8/components/SuperSimpleApiDisplayV8';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { usePageScroll } from '@/hooks/usePageScroll';

const MODULE_TAG = '[🔧 DEVICE-MGMT-FLOW-V8]';
const FLOW_KEY = 'mfa-device-mgmt-v8';

interface Credentials {
	environmentId: string;
	username: string;
	[key: string]: unknown;
}

export const MFADeviceManagementFlowV8: React.FC = () => {
	console.log(`${MODULE_TAG} Initializing device management flow`);

	// Scroll to top on page load
	usePageScroll({ pageName: 'MFA Device Management V8', force: true });

	const [credentials, setCredentials] = useState<Credentials>(() => {
		const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});

		return {
			environmentId: stored.environmentId || '',
			username: stored.username || '',
		};
	});

	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);
	const [isReady, setIsReady] = useState(false);

	// Check token status periodically
	useEffect(() => {
		const checkStatus = () => {
			const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(status);
		};

		const interval = setInterval(checkStatus, 30000);

		const handleStorageChange = () => {
			checkStatus();
		};
		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('workerTokenUpdated', handleStorageChange);

		return () => {
			clearInterval(interval);
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('workerTokenUpdated', handleStorageChange);
		};
	}, []);

	// Clear API calls on mount
	useEffect(() => {
		apiCallTrackerService.clearApiCalls();
	}, []);

	// Save credentials when they change
	useEffect(() => {
		console.log(`${MODULE_TAG} Credentials changed, saving`, credentials);
		CredentialsServiceV8.saveCredentials(FLOW_KEY, credentials);
	}, [credentials]);

	const handleManageWorkerToken = () => {
		if (tokenStatus.isValid) {
			if (confirm('Worker token is currently stored.\n\nDo you want to remove it?')) {
				workerTokenServiceV8.clearToken();
				window.dispatchEvent(new Event('workerTokenUpdated'));
				const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				setTokenStatus(newStatus);
				toastV8.success('Worker token removed');
			}
		} else {
			setShowWorkerTokenModal(true);
		}
	};

	const handleWorkerTokenGenerated = () => {
		window.dispatchEvent(new Event('workerTokenUpdated'));
		const newStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
		setTokenStatus(newStatus);
		toastV8.success('Worker token generated and saved!');
	};

	const handleLoadDevices = () => {
		if (!credentials.environmentId?.trim()) {
			toastV8.error('Environment ID is required');
			return;
		}
		if (!credentials.username?.trim()) {
			toastV8.error('Username is required');
			return;
		}
		if (!tokenStatus.isValid) {
			toastV8.error('Worker token is required');
			return;
		}

		setIsReady(true);
	};

	return (
		<div className="mfa-device-mgmt-flow-v8">
			<div className="flow-header">
				<div className="header-content">
					<div className="header-left">
						<span className="version-tag">V8</span>
						<div className="header-text">
							<h1>MFA Device Management</h1>
							<p>View and manage user MFA devices</p>
						</div>
					</div>
				</div>
			</div>

			<div className="flow-container">
				{/* MFA Navigation Links */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
					<div className="mfa-nav-links" style={{ marginBottom: 0 }}>
						<button
							onClick={() => window.location.href = '/v8/mfa-hub'}
							className="nav-link-btn"
							title="Go to MFA Hub"
						>
							🏠 MFA Hub
						</button>
						<button
							onClick={() => window.location.href = '/v8/mfa'}
							className="nav-link-btn"
							title="Register MFA Devices"
						>
							📱 Device Registration
						</button>
						<button
							onClick={() => window.location.href = '/v8/mfa-reporting'}
							className="nav-link-btn"
							title="View MFA Reports"
						>
							📊 Reporting
						</button>
					</div>
					<ApiDisplayCheckbox />
				</div>

				{!isReady ? (
					<div className="setup-section">
						<h2>Setup</h2>
						<p>Enter user details to manage their MFA devices</p>

						{/* Worker Token Status */}
						<div style={{ marginBottom: '20px' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
								<button
									type="button"
									onClick={handleManageWorkerToken}
									className="token-button"
									style={{
										padding: '10px 16px',
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
									}}
								>
									<span>🔑</span>
									<span>{tokenStatus.isValid ? 'Manage Token' : 'Add Token'}</span>
								</button>

								<div
									style={{
										flex: 1,
										padding: '10px 12px',
										background: tokenStatus.isValid
											? tokenStatus.status === 'expiring-soon'
												? '#fef3c7'
												: '#d1fae5'
											: '#fee2e2',
										border: `1px solid ${WorkerTokenStatusServiceV8.getStatusColor(tokenStatus.status)}`,
										borderRadius: '4px',
										fontSize: '12px',
										fontWeight: '500',
										color: tokenStatus.isValid
											? tokenStatus.status === 'expiring-soon'
												? '#92400e'
												: '#065f46'
											: '#991b1b',
									}}
								>
									<span>{WorkerTokenStatusServiceV8.getStatusIcon(tokenStatus.status)}</span>
									<span style={{ marginLeft: '6px' }}>{tokenStatus.message}</span>
								</div>
							</div>

							{!tokenStatus.isValid && (
								<div className="info-box" style={{ marginBottom: '0' }}>
									<p>
										<strong>⚠️ Worker Token Required:</strong> This flow uses a worker token to
										manage MFA devices. Please click "Add Token" to configure your worker token
										credentials.
									</p>
								</div>
							)}
						</div>

						<div className="credentials-grid">
							<div className="form-group">
								<label htmlFor="mgmt-env-id">
									Environment ID <span className="required">*</span>
								</label>
								<input
									id="mgmt-env-id"
									type="text"
									value={credentials.environmentId}
									onChange={(e) =>
										setCredentials({ ...credentials, environmentId: e.target.value })
									}
									placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
								/>
								<small>PingOne environment ID</small>
							</div>

							<div className="form-group">
								<label htmlFor="mgmt-username">
									Username <span className="required">*</span>
								</label>
								<input
									id="mgmt-username"
									type="text"
									value={credentials.username}
									onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
									placeholder="john.doe"
								/>
								<small>PingOne username to manage devices for</small>
							</div>
						</div>

						<button
							type="button"
							className="btn btn-primary"
							onClick={handleLoadDevices}
							disabled={
								!credentials.environmentId ||
								!credentials.username ||
								!tokenStatus.isValid
							}
							style={{ marginTop: '20px' }}
						>
							Load Devices
						</button>
					</div>
				) : (
					<>
						<div style={{ marginBottom: '20px', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
							<button
								onClick={() => setIsReady(false)}
								style={{
									padding: '6px 12px',
									background: '#6b7280',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									fontSize: '13px',
									cursor: 'pointer',
								}}
							>
								← Back to Setup
							</button>
						</div>
						<MFADeviceManagerV8
							environmentId={credentials.environmentId}
							username={credentials.username}
						/>
					</>
				)}
			</div>

			{/* Worker Token Modal */}
			<WorkerTokenModalV8
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				onTokenGenerated={handleWorkerTokenGenerated}
				environmentId={credentials.environmentId}
			/>

			<style>{`
				.mfa-device-mgmt-flow-v8 {
					max-width: 1200px;
					margin: 0 auto;
					background: #f8f9fa;
					min-height: 100vh;
				}

				.flow-header {
					background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
					padding: 28px 40px;
					margin-bottom: 0;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
				}

				.header-content {
					display: flex;
					align-items: center;
					justify-content: space-between;
				}

				.header-left {
					display: flex;
					align-items: flex-start;
					gap: 20px;
					flex: 1;
				}

				.version-tag {
					font-size: 11px;
					font-weight: 700;
					color: rgba(26, 26, 26, 0.7);
					letter-spacing: 1.5px;
					text-transform: uppercase;
					padding-top: 2px;
				}

				.header-text {
					margin: 0;
				}

				.flow-header h1 {
					font-size: 26px;
					font-weight: 700;
					margin: 0 0 4px 0;
					color: #1a1a1a;
				}

				.flow-header p {
					font-size: 13px;
					color: rgba(26, 26, 26, 0.75);
					margin: 0;
				}

				.flow-container {
					padding: 20px;
				}

				.mfa-nav-links {
					display: flex;
					gap: 12px;
					padding: 16px 0;
					flex-wrap: wrap;
				}

				.nav-link-btn {
					padding: 10px 20px;
					background: white;
					color: #1f2937;
					border: 1px solid #e5e7eb;
					border-radius: 8px;
					font-size: 14px;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
					display: flex;
					align-items: center;
					gap: 8px;
				}

				.nav-link-btn:hover {
					background: #f9fafb;
					border-color: #3b82f6;
					color: #3b82f6;
					transform: translateY(-2px);
					box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
				}

				.setup-section {
					background: white;
					border: 1px solid #ddd;
					border-radius: 8px;
					padding: 20px;
				}

				.setup-section h2 {
					font-size: 20px;
					font-weight: 600;
					margin: 0 0 8px 0;
					color: #1f2937;
				}

				.setup-section > p {
					font-size: 14px;
					color: #6b7280;
					margin: 0 0 20px 0;
				}

				.credentials-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
					gap: 16px;
				}

				.form-group {
					display: flex;
					flex-direction: column;
					gap: 6px;
				}

				.form-group label {
					font-size: 13px;
					font-weight: 500;
					color: #374151;
				}

				.required {
					color: #ef4444;
					margin-left: 2px;
				}

				.form-group input {
					padding: 10px 12px;
					border: 1px solid #d1d5db;
					borderRadius: 6px;
					fontSize: 14px;
					fontFamily: monospace;
					color: #1f2937;
					background: white;
				}

				.form-group input:focus {
					outline: none;
					border-color: #3b82f6;
					box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
				}

				.form-group small {
					font-size: 12px;
					color: #6b7280;
				}

				.info-box {
					background: #dbeafe;
					border: 1px solid #93c5fd;
					border-radius: 8px;
					padding: 16px;
					margin: 16px 0;
				}

				.info-box p {
					margin: 8px 0;
					font-size: 14px;
					color: #1e40af;
				}

				.btn {
					padding: 12px 24px;
					border: none;
					border-radius: 6px;
					font-size: 14px;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.btn-primary {
					background: #3b82f6;
					color: white;
				}

				.btn-primary:hover {
					background: #2563eb;
				}

				.btn-primary:disabled {
					background: #d1d5db;
					cursor: not-allowed;
				}
			`}</style>

			<SuperSimpleApiDisplayV8 />
		</div>
	);
};

export default MFADeviceManagementFlowV8;
