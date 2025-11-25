/**
 * @file MFANavigationV8.tsx
 * @module v8/components
 * @description Shared navigation component for all MFA flows
 * @version 8.0.0
 */

import React from 'react';
import { ApiDisplayCheckbox } from './SuperSimpleApiDisplayV8';
import { uiNotificationServiceV8 } from '@/v8/services/uiNotificationServiceV8';

interface MFANavigationV8Props {
	/** Current page identifier for highlighting */
	currentPage?: 'hub' | 'registration' | 'management' | 'reporting' | 'settings';
	/** Show restart flow button (only for flows that can be restarted) */
	showRestartFlow?: boolean;
	/** Handler for restart flow action */
	onRestartFlow?: () => void;
	/** Show back to main button */
	showBackToMain?: boolean;
}

export const MFANavigationV8: React.FC<MFANavigationV8Props> = ({
	currentPage,
	showRestartFlow = false,
	onRestartFlow,
	showBackToMain = true,
}) => {
	const handleRestartFlow = async () => {
		if (!onRestartFlow) return;
		
		const confirmed = await uiNotificationServiceV8.confirm({
			message: 'Are you sure you want to restart the flow? All progress will be lost.',
			title: 'Restart Flow',
			severity: 'warning',
			confirmText: 'Restart',
			cancelText: 'Cancel',
		});
		
		if (confirmed) {
			onRestartFlow();
		}
	};

	return (
		<>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '16px',
					flexWrap: 'wrap',
					gap: '12px',
				}}
			>
				<div className="mfa-nav-links" style={{ marginBottom: 0, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
					<button
						onClick={() => (window.location.href = '/v8/mfa-hub')}
						className="nav-link-btn"
						title="Go to MFA Hub"
						style={{
							opacity: currentPage === 'hub' ? 1 : 0.8,
							fontWeight: currentPage === 'hub' ? '600' : '500',
						}}
					>
						🏠 MFA Hub
					</button>
					<button
						onClick={() => (window.location.href = '/v8/mfa')}
						className="nav-link-btn"
						title="Register MFA Devices"
						style={{
							opacity: currentPage === 'registration' ? 1 : 0.8,
							fontWeight: currentPage === 'registration' ? '600' : '500',
						}}
					>
						📱 Device Registration
					</button>
					<button
						onClick={() => (window.location.href = '/v8/mfa-device-management')}
						className="nav-link-btn"
						title="Manage MFA Devices"
						style={{
							opacity: currentPage === 'management' ? 1 : 0.8,
							fontWeight: currentPage === 'management' ? '600' : '500',
						}}
					>
						🔧 Device Management
					</button>
					<button
						onClick={() => (window.location.href = '/v8/mfa-reporting')}
						className="nav-link-btn"
						title="View MFA Reports"
						style={{
							opacity: currentPage === 'reporting' ? 1 : 0.8,
							fontWeight: currentPage === 'reporting' ? '600' : '500',
						}}
					>
						📊 Reporting
					</button>
					{showRestartFlow && (
						<button
							onClick={handleRestartFlow}
							className="nav-link-btn restart-btn"
							title="Restart the flow from the beginning"
							style={{
								opacity: 0.8,
							}}
						>
							🔄 Restart Flow
						</button>
					)}
				</div>
				<div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
					{showBackToMain && (
						<button
							onClick={() => (window.location.href = '/v8/mfa-hub')}
							style={{
								padding: '6px 12px',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								fontSize: '13px',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '6px',
								fontWeight: '500',
							}}
						>
							🏠 Back to Main
						</button>
					)}
					<ApiDisplayCheckbox />
				</div>
			</div>
			<style>{`
				.mfa-nav-links {
					display: flex;
					gap: 12px;
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

				.nav-link-btn.restart-btn:hover {
					border-color: #ef4444;
					color: #ef4444;
				}
			`}</style>
		</>
	);
};

