/**
 * @file SuccessStepV8.tsx
 * @module v8/flows/shared
 * @description Success Screen Step for Device Authentication flows
 * @version 8.1.0
 */

import React from 'react';
import {
	FiCheckCircle,
	FiCpu,
	FiDownload,
	FiExternalLink,
	FiRefreshCw,
	FiShield,
} from 'react-icons/fi';
import type { MFAFlowBaseRenderProps } from './MFAFlowBaseV8';

const MODULE_TAG = '[✅ SUCCESS-STEP-V8]';

interface SuccessStepV8Props {
	renderProps: MFAFlowBaseRenderProps;
}

export const SuccessStepV8: React.FC<SuccessStepV8Props> = ({ renderProps }) => {
	const { credentials, mfaState } = renderProps;

	const handleExportData = () => {
		const exportData = {
			timestamp: new Date().toISOString(),
			user: {
				username: credentials.username,
				environmentId: credentials.environmentId,
				tokenType: credentials.tokenType,
			},
			device: {
				deviceId: mfaState.deviceId,
				deviceType: credentials.deviceType,
				status: mfaState.deviceStatus,
			},
			authentication: {
				completed: !!mfaState.verificationResult,
				timestamp: mfaState.verificationResult?.timestamp,
			},
		};

		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `mfa-auth-${credentials.username}-${Date.now()}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		console.log(`${MODULE_TAG} Exported authentication data`);
	};

	const handleStartNewFlow = () => {
		// Reset and start new authentication flow
		window.location.reload();
	};

	const handleViewDeviceManagement = () => {
		// Navigate to device management
		window.location.href = '/v8/unified-mfa';
	};

	const isSuccess = mfaState.verificationResult?.success || mfaState.deviceStatus === 'ACTIVE';

	return (
		<div className="step-content">
			<div style={{ textAlign: 'center', marginBottom: '32px' }}>
				<div
					style={{
						width: '80px',
						height: '80px',
						background: isSuccess ? '#10b981' : '#f59e0b',
						borderRadius: '50%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						margin: '0 auto 20px',
					}}
				>
					<FiCheckCircle size={40} color="white" />
				</div>
				<h2
					style={{
						fontSize: '24px',
						fontWeight: '700',
						color: '#1f2937',
						margin: '0 0 8px 0',
						textAlign: 'center',
					}}
				>
					{isSuccess ? 'Authentication Successful!' : 'Device Created!'}
				</h2>
				<p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 24px 0' }}>
					{isSuccess
						? `You have successfully authenticated with your ${credentials.deviceType} device.`
						: 'The authentication process has been completed.'}
				</p>
			</div>

			<div className="success-box">
				<h3>
					<FiShield style={{ marginRight: '8px', color: '#10b981' }} />
					Session Summary
				</h3>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
						gap: '16px',
						marginTop: '16px',
					}}
				>
					<div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
						<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>User</div>
						<div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
							{credentials.username}
						</div>
					</div>

					<div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
						<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
							Device Type
						</div>
						<div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
							{credentials.deviceType}
						</div>
					</div>

					<div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
						<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Device ID</div>
						<div
							style={{
								fontSize: '14px',
								fontWeight: '600',
								color: '#1f2937',
								fontFamily: 'monospace',
							}}
						>
							{mfaState.deviceId || 'N/A'}
						</div>
					</div>

					<div style={{ padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
						<div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Status</div>
						<div
							style={{
								fontSize: '14px',
								fontWeight: '600',
								color: isSuccess ? '#10b981' : '#f59e0b',
							}}
						>
							{mfaState.deviceStatus || 'Completed'}
						</div>
					</div>
				</div>

				{mfaState.verificationResult && (
					<div
						style={{
							marginTop: '16px',
							padding: '12px',
							background: '#f0fdf4',
							border: '1px solid #86efac',
							borderRadius: '6px',
						}}
					>
						<div style={{ fontSize: '12px', color: '#15803d', marginBottom: '4px' }}>
							Verification Result
						</div>
						<div style={{ fontSize: '14px', color: '#15803d' }}>
							{mfaState.verificationResult.success ? '✓ Verified' : '⚠ Completed with warnings'}
						</div>
						{mfaState.verificationResult.timestamp && (
							<div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
								Completed: {new Date(mfaState.verificationResult.timestamp).toLocaleString()}
							</div>
						)}
					</div>
				)}
			</div>

			<div style={{ marginTop: '24px' }}>
				<h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
					<FiCpu style={{ marginRight: '8px', color: '#10b981' }} />
					Next Steps & Options
				</h3>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
						gap: '12px',
					}}
				>
					<button
						type="button"
						onClick={handleExportData}
						style={{
							padding: '12px 16px',
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							fontSize: '14px',
							fontWeight: '500',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							transition: 'all 0.2s ease',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.background = '#2563eb';
							e.currentTarget.style.transform = 'translateY(-1px)';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.background = '#3b82f6';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
					>
						<FiDownload size={16} />
						Export Session Data
					</button>

					<button
						type="button"
						onClick={handleStartNewFlow}
						style={{
							padding: '12px 16px',
							background: '#10b981',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							fontSize: '14px',
							fontWeight: '500',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							transition: 'all 0.2s ease',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.background = '#059669';
							e.currentTarget.style.transform = 'translateY(-1px)';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.background = '#10b981';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
					>
						<FiRefreshCw size={16} />
						Start New Authentication
					</button>

					<button
						type="button"
						onClick={handleViewDeviceManagement}
						style={{
							padding: '12px 16px',
							background: '#6b7280',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							fontSize: '14px',
							fontWeight: '500',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							transition: 'all 0.2s ease',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.background = '#4b5563';
							e.currentTarget.style.transform = 'translateY(-1px)';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.background = '#6b7280';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
					>
						<FiExternalLink size={16} />
						Device Management
					</button>
				</div>
			</div>

			<div className="info-box" style={{ marginTop: '24px' }}>
				<h4>
					<FiShield style={{ marginRight: '8px', color: '#1e40af' }} />
					Security Information
				</h4>
				<ul>
					<li>
						Your authentication token is securely stored and will expire according to your
						organization's policy
					</li>
					<li>Device authentication logs are recorded for audit and compliance purposes</li>
					<li>You can revoke device access at any time through the device management interface</li>
				</ul>
			</div>

			<style>{`
				.step-content h2 {
					display: flex;
					align-items: center;
					font-size: 18px;
					font-weight: 600;
					color: #1f2937;
					margin-bottom: 12px;
				}

				.step-content > p {
					font-size: 14px;
					color: #6b7280;
					margin-bottom: 20px;
					line-height: 1.5;
				}

				.success-box {
					background: #d1fae5;
					border: 1px solid #6ee7b7;
					border-radius: 8px;
					padding: 20px;
					margin: 20px 0;
				}

				.success-box h3 {
					display: flex;
					align-items: center;
					margin: 0 0 12px 0;
					font-size: 16px;
					font-weight: 600;
					color: #065f46;
				}

				.info-box {
					background: #dbeafe;
					border: 1px solid #93c5fd;
					border-radius: 8px;
					padding: 20px;
					margin: 20px 0;
				}

				.info-box h4 {
					display: flex;
					align-items: center;
					margin: 0 0 12px 0;
					font-size: 16px;
					font-weight: 600;
					color: #1e40af;
				}

				.info-box ul {
					margin: 12px 0;
					padding-left: 20px;
				}

				.info-box li {
					margin: 8px 0;
					font-size: 14px;
					color: #1e40af;
					line-height: 1.4;
				}
			`}</style>
		</div>
	);
};
