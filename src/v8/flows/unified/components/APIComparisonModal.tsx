/**
 * @file APIComparisonModal.tsx
 * @module v8/flows/unified/components
 * @description Modal showing API differences between Admin, Admin Activation Required, and User flows
 * @version 8.0.0
 */

import React from 'react';

interface APIComparisonModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const APIComparisonModal: React.FC<APIComparisonModalProps> = ({ isOpen, onClose }) => {
	if (!isOpen) return null;

	const apiEndpoints = {
		admin: {
			name: 'Admin Flow',
			description: 'Uses Worker Token, creates device with ACTIVE status',
			method: 'POST',
			url: '/api/pingone/mfa/register-device',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer WORKER_TOKEN',
			},
			body: {
				environmentId: 'env-123456',
				username: 'admin@example.com',
				type: 'SMS',
				tokenType: 'worker',
				status: 'ACTIVE',
				phoneNumber: '+1234567890',
				countryCode: '+1',
			},
			response: {
				deviceId: 'dev-123456',
				status: 'ACTIVE',
				type: 'SMS',
				createdAt: '2026-01-30T00:00:00Z',
			},
			notes: 'Device is immediately active and ready to use. No OTP required.',
		},
		adminActivationRequired: {
			name: 'Admin Activation Required Flow',
			description: 'Uses Worker Token, creates device with ACTIVATION_REQUIRED status',
			method: 'POST',
			url: '/api/pingone/mfa/register-device',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer WORKER_TOKEN',
			},
			body: {
				environmentId: 'env-123456',
				username: 'admin@example.com',
				type: 'SMS',
				tokenType: 'worker',
				status: 'ACTIVATION_REQUIRED',
				phoneNumber: '+1234567890',
				countryCode: '+1',
			},
			response: {
				deviceId: 'dev-123456',
				status: 'ACTIVATION_REQUIRED',
				type: 'SMS',
				deviceActivateUri: '/api/pingone/mfa/devices/dev-123456/activate',
				createdAt: '2026-01-30T00:00:00Z',
			},
			notes: 'PingOne automatically sends OTP. User must validate OTP to activate device.',
		},
		user: {
			name: 'User Flow',
			description:
				'Uses User Token (from OAuth login), creates device with ACTIVATION_REQUIRED status',
			method: 'POST',
			url: '/api/pingone/mfa/register-device',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer USER_TOKEN',
			},
			body: {
				environmentId: 'env-123456',
				username: 'user@example.com',
				type: 'SMS',
				tokenType: 'user',
				userToken: 'oauth-user-token-123',
				status: 'ACTIVATION_REQUIRED',
				phoneNumber: '+1234567890',
				countryCode: '+1',
			},
			response: {
				deviceId: 'dev-123456',
				status: 'ACTIVATION_REQUIRED',
				type: 'SMS',
				deviceActivateUri: '/api/pingone/mfa/devices/dev-123456/activate',
				createdAt: '2026-01-30T00:00:00Z',
			},
			notes:
				'User must be logged into PingOne first. PingOne automatically sends OTP for activation.',
		},
	};

	const renderCodeBlock = (code: object) => (
		<pre
			style={{
				background: '#1e293b',
				color: '#e2e8f0',
				padding: '16px',
				borderRadius: '8px',
				overflow: 'auto',
				fontSize: '14px',
				fontFamily: 'Monaco, Consolas, monospace',
			}}
		>
			<code>{JSON.stringify(code, null, 2)}</code>
		</pre>
	);

	return (
		<div
			role="button"
			tabIndex={0}
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				background: 'rgba(0, 0, 0, 0.5)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 1000,
			}}
			onClick={onClose}
		>
			<div
				role="button"
				tabIndex={0}
				style={{
					background: 'white',
					borderRadius: '12px',
					maxWidth: '1200px',
					width: '90%',
					maxHeight: '90vh',
					overflow: 'auto',
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					style={{
						padding: '24px',
						borderBottom: '1px solid #e5e7eb',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<div>
						<h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>
							MFA Flow API Comparison
						</h2>
						<p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
							API calls and parameters for Admin, Admin Activation Required, and User flows
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							fontSize: '24px',
							cursor: 'pointer',
							color: '#6b7280',
							padding: '4px',
						}}
					>
						×
					</button>
				</div>

				{/* Content */}
				<div style={{ padding: '24px' }}>
					{Object.entries(apiEndpoints).map(([key, flow]) => (
						<div
							key={key}
							style={{
								marginBottom: '32px',
								padding: '24px',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								background:
									key === 'admin'
										? '#f0fdf4'
										: key === 'adminActivationRequired'
											? '#fef3c7'
											: '#dbeafe',
							}}
						>
							{/* Flow Header */}
							<div style={{ marginBottom: '20px' }}>
								<h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
									{flow.name}
								</h3>
								<p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
									{flow.description}
								</p>
							</div>

							{/* API Details */}
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
								{/* Left Column */}
								<div>
									{/* URL and Method */}
									<div style={{ marginBottom: '16px' }}>
										<h4
											style={{
												margin: '0 0 8px 0',
												fontSize: '14px',
												fontWeight: '600',
												color: '#374151',
											}}
										>
											Endpoint
										</h4>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												marginBottom: '8px',
											}}
										>
											<span
												style={{
													background: flow.method === 'POST' ? '#10b981' : '#6b7280',
													color: 'white',
													padding: '4px 8px',
													borderRadius: '4px',
													fontSize: '12px',
													fontWeight: '600',
												}}
											>
												{flow.method}
											</span>
											<code
												style={{
													background: '#f3f4f6',
													padding: '4px 8px',
													borderRadius: '4px',
													fontSize: '13px',
												}}
											>
												{flow.url}
											</code>
										</div>
									</div>

									{/* Headers */}
									<div style={{ marginBottom: '16px' }}>
										<h4
											style={{
												margin: '0 0 8px 0',
												fontSize: '14px',
												fontWeight: '600',
												color: '#374151',
											}}
										>
											Headers
										</h4>
										{renderCodeBlock(flow.headers)}
									</div>
								</div>

								{/* Right Column */}
								<div>
									{/* Request Body */}
									<div style={{ marginBottom: '16px' }}>
										<h4
											style={{
												margin: '0 0 8px 0',
												fontSize: '14px',
												fontWeight: '600',
												color: '#374151',
											}}
										>
											Request Body
										</h4>
										{renderCodeBlock(flow.body)}
									</div>

									{/* Response */}
									<div style={{ marginBottom: '16px' }}>
										<h4
											style={{
												margin: '0 0 8px 0',
												fontSize: '14px',
												fontWeight: '600',
												color: '#374151',
											}}
										>
											Response
										</h4>
										{renderCodeBlock(flow.response)}
									</div>
								</div>
							</div>

							{/* Notes */}
							<div
								style={{
									marginTop: '16px',
									padding: '12px',
									background: 'white',
									borderRadius: '6px',
								}}
							>
								<h4
									style={{
										margin: '0 0 8px 0',
										fontSize: '14px',
										fontWeight: '600',
										color: '#374151',
									}}
								>
									📝 Notes
								</h4>
								<p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
									{flow.notes}
								</p>
							</div>
						</div>
					))}

					{/* Key Differences Summary */}
					<div
						style={{
							padding: '20px',
							background: '#f9fafb',
							border: '1px solid #e5e7eb',
							borderRadius: '8px',
							marginTop: '24px',
						}}
					>
						<h3
							style={{
								margin: '0 0 16px 0',
								fontSize: '16px',
								fontWeight: '600',
								color: '#111827',
							}}
						>
							🔑 Key Differences
						</h3>
						<ul
							style={{
								margin: 0,
								paddingLeft: '20px',
								color: '#374151',
								fontSize: '14px',
								lineHeight: '1.6',
							}}
						>
							<li>
								<strong>Token Type:</strong> Admin flows use <code>tokenType: 'worker'</code>, User
								flow uses <code>tokenType: 'user'</code>
							</li>
							<li>
								<strong>Authentication:</strong> Admin flows use Worker Token, User flow requires
								User Token from OAuth login
							</li>
							<li>
								<strong>Device Status:</strong> Admin flow can choose <code>'ACTIVE'</code> or{' '}
								<code>'ACTIVATION_REQUIRED'</code>, User flow always uses{' '}
								<code>'ACTIVATION_REQUIRED'</code>
							</li>
							<li>
								<strong>OTP Requirement:</strong> Only flows with <code>'ACTIVATION_REQUIRED'</code>{' '}
								status trigger OTP automatically
							</li>
							<li>
								<strong>User Token:</strong> User flow includes <code>userToken</code> field from
								OAuth login
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};
