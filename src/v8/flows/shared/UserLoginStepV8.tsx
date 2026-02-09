/**
 * @file UserLoginStepV8.tsx
 * @module v8/flows/shared
 * @description User Login Step for Device Authentication flows with OAuth PKCE
 * @version 8.1.0
 */

import React from 'react';
import { FiExternalLink, FiKey, FiShield } from 'react-icons/fi';
import type { MFAFlowBaseRenderProps } from './MFAFlowBaseV8';

const MODULE_TAG = '[🔐 USER-LOGIN-STEP-V8]';

interface UserLoginStepV8Props {
	renderProps: MFAFlowBaseRenderProps;
}

export const UserLoginStepV8: React.FC<UserLoginStepV8Props> = ({ renderProps }) => {
	const { credentials, setShowUserLoginModal } = renderProps;

	const handleStartAuthentication = () => {
		console.log(`${MODULE_TAG} Starting PingOne Authentication`);
		setShowUserLoginModal(true);
	};

	const isAuthenticated = credentials.tokenType === 'user' && credentials.userToken?.trim();

	return (
		<div className="step-content">
			<h2>
				<FiShield style={{ marginRight: '8px', color: '#10b981' }} />
				User Authentication Required
			</h2>
			<p>
				To authenticate with your device, you must first sign in with your PingOne account using
				Authorization Code Flow with PKCE.
			</p>

			{isAuthenticated ? (
				<div className="success-box">
					<h3>
						<FiShield style={{ marginRight: '8px', color: '#10b981' }} />
						Authentication Complete
					</h3>
					<p>
						You have successfully authenticated as <strong>{credentials.username}</strong>. You can
						now proceed to device selection.
					</p>
					<div style={{ marginTop: '12px', fontSize: '12px', color: '#047857' }}>
						<div>• User Token: Present ✓</div>
						<div>• Flow Type: User Authentication</div>
						<div>• Ready for Step 2: Device Selection</div>
					</div>
				</div>
			) : (
				<div className="info-box">
					<h4>
						<FiKey style={{ marginRight: '8px', color: '#1e40af' }} />
						PingOne Authentication
					</h4>
					<p>This step will redirect you to PingOne's secure authentication page where you'll:</p>
					<ul>
						<li>Sign in with your PingOne credentials</li>
						<li>Grant permission for device authentication</li>
						<li>Receive an access token for secure API calls</li>
					</ul>
					<p style={{ marginTop: '12px', fontSize: '12px', color: '#1e40af' }}>
						<strong>Security Note:</strong> This uses OAuth 2.0 Authorization Code Flow with PKCE,
						which is the industry standard for secure authentication.
					</p>
				</div>
			)}

			<div style={{ marginTop: '20px', textAlign: 'center' }}>
				{!isAuthenticated ? (
					<button
						type="button"
						className="btn btn-primary"
						onClick={handleStartAuthentication}
						style={{
							padding: '12px 24px',
							fontSize: '16px',
							fontWeight: '600',
							borderRadius: '8px',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							margin: '0 auto',
							boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
							transition: 'all 0.2s ease',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.transform = 'translateY(-2px)';
							e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.transform = 'translateY(0)';
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
						}}
					>
						<FiExternalLink size={18} />
						Start PingOne Authentication
					</button>
				) : (
					<div
						style={{
							padding: '16px',
							background: '#f0fdf4',
							border: '1px solid #86efac',
							borderRadius: '8px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
							<FiShield style={{ color: '#16a34a' }} />
							<span style={{ fontWeight: '600', color: '#16a34a' }}>Ready for Next Step</span>
						</div>
						<p style={{ margin: 0, fontSize: '14px', color: '#15803d' }}>
							Click "Next" to proceed to device selection.
						</p>
					</div>
				)}
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
					margin: 6px 0;
					font-size: 14px;
					color: #1e40af;
					line-height: 1.4;
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

				.success-box p {
					margin: 8px 0;
					font-size: 14px;
					color: #047857;
					line-height: 1.4;
				}
			`}</style>
		</div>
	);
};
