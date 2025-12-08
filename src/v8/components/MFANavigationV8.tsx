/**
 * @file MFANavigationV8.tsx
 * @module v8/components
 * @description Shared navigation component for all MFA flows
 * @version 8.1.0
 * 
 * Reusable navigation bar component that can be added to any MFA page for consistency.
 * Includes navigation links, Back to Main button, and Show API Calls toggle.
 * All buttons are displayed on one line within a bordered container box.
 * 
 * @example
 * // Add to any MFA page at the top
 * <MFANavigationV8 currentPage="hub" showBackToMain={true} />
 */

import React from 'react';
import { uiNotificationServiceV8 } from '@/v8/services/uiNotificationServiceV8';
import { ApiDisplayCheckbox } from './SuperSimpleApiDisplayV8';

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
					padding: '12px 16px',
					background: 'white',
					border: '1px solid #e5e7eb',
					borderRadius: '8px',
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				}}
			>
				<div className="mfa-nav-links" style={{ marginBottom: 0, display: 'flex', gap: '0', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
					<button
						onClick={() => (window.location.href = '/v8/mfa-hub')}
						className="nav-link-btn"
						title="Go to MFA Hub"
						style={{
							opacity: currentPage === 'hub' ? 1 : 0.8,
							fontWeight: currentPage === 'hub' ? '600' : '500',
							flex: 1,
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
							flex: 1,
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
							flex: 1,
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
							flex: 1,
						}}
					>
						📊 Reporting
					</button>
					<button
						onClick={() => (window.location.href = '/v8/mfa-config')}
						className="nav-link-btn"
						title="MFA Configuration"
						style={{
							opacity: currentPage === 'settings' ? 1 : 0.8,
							fontWeight: currentPage === 'settings' ? '600' : '500',
							flex: 1,
						}}
					>
						⚙️ MFA Config
					</button>
					{showRestartFlow && (
						<button
							onClick={handleRestartFlow}
							className="nav-link-btn restart-btn"
							title="Restart the flow from the beginning"
							style={{
								opacity: 0.8,
								flex: 1,
							}}
						>
							🔄 Restart Flow
						</button>
					)}
					{showBackToMain && (
						<button
							onClick={() => (window.location.href = '/v8/mfa-hub')}
							style={{
								padding: '10px 20px',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '8px',
								fontSize: '14px',
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								fontWeight: '500',
								marginLeft: '12px',
							}}
						>
							🏠 Back to Main
						</button>
					)}
					<div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center' }}>
						<ApiDisplayCheckbox />
					</div>
				</div>
			</div>
			<style>{`
				.mfa-nav-links {
					display: flex;
					gap: 0;
					flex-wrap: nowrap;
					width: 100%;
				}

				.nav-link-btn {
					padding: 10px 16px;
					background: #f3f4f6;
					color: #1f2937;
					border: none;
					border-right: 1px solid #e5e7eb;
					border-radius: 0;
					font-size: 14px;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 8px;
					text-align: center;
				}

				.nav-link-btn:first-child {
					border-top-left-radius: 6px;
					border-bottom-left-radius: 6px;
				}

				.mfa-nav-links > .nav-link-btn:last-child {
					border-top-right-radius: 6px;
					border-bottom-right-radius: 6px;
					border-right: none;
				}

				.nav-link-btn:hover {
					background: #e5e7eb;
					color: #3b82f6;
				}

				.nav-link-btn.restart-btn:hover {
					color: #ef4444;
				}
			`}</style>
		</>
	);
};

