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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uiNotificationServiceV8 } from '@/v8/services/uiNotificationServiceV8';
import { navigateToMfaHubWithCleanup } from '@/v8/utils/mfaFlowCleanupV8';
import { ApiDisplayCheckbox } from './SuperSimpleApiDisplayV8';
import { MFADocumentationModalV8 } from './MFADocumentationModalV8';

interface MFANavigationV8Props {
	/** Current page identifier for highlighting */
	currentPage?:
		| 'hub'
		| 'registration'
		| 'management'
		| 'ordering'
		| 'reporting'
		| 'settings'
		| undefined;
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
	const navigate = useNavigate();
	const [showDocsModal, setShowDocsModal] = useState(false);

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
				<div
					className="mfa-nav-links"
					style={{
						marginBottom: 0,
						display: 'flex',
						gap: '0',
						flex: 1,
						alignItems: 'center',
					}}
				>
					<button
						type="button"
						onClick={() => navigateToMfaHubWithCleanup(navigate)}
						className={`nav-link-btn ${currentPage === 'hub' ? 'active' : ''}`}
						title="Go to MFA Hub"
						style={{
							fontWeight: currentPage === 'hub' ? '600' : '500',
							flex: 1,
							background: '#3b82f6',
							color: 'white',
							border: '2px solid #3b82f6',
						}}
					>
						🏠 MFA Hub
					</button>
					<button
						type="button"
						onClick={() => navigate('/v8/mfa-device-management')}
						className={`nav-link-btn ${currentPage === 'management' ? 'active' : ''}`}
						title="Manage MFA Devices"
						style={{
							fontWeight: currentPage === 'management' ? '600' : '500',
							flex: 1,
						}}
					>
						🔧 Device Management
					</button>
					<button
						type="button"
						onClick={() => navigate('/v8/mfa-device-ordering')}
						className={`nav-link-btn ${currentPage === 'ordering' ? 'active' : ''}`}
						title="Configure MFA device ordering"
						style={{
							fontWeight: currentPage === 'ordering' ? '600' : '500',
							flex: 1,
						}}
					>
						📋 Device Ordering
					</button>
					<button
						type="button"
						onClick={() => navigate('/v8/mfa-reporting')}
						className={`nav-link-btn ${currentPage === 'reporting' ? 'active' : ''}`}
						title="View MFA Reports"
						style={{
							fontWeight: currentPage === 'reporting' ? '600' : '500',
							flex: 1,
						}}
					>
						📊 Reporting
					</button>
					<button
						type="button"
						onClick={() => navigate('/v8/mfa-config')}
						className={`nav-link-btn ${currentPage === 'settings' ? 'active' : ''}`}
						title="MFA Configuration"
						style={{
							fontWeight: currentPage === 'settings' ? '600' : '500',
							flex: 1,
						}}
					>
						⚙️ MFA Config
					</button>
					<button
						type="button"
						onClick={() => setShowDocsModal(true)}
						className="nav-link-btn"
						title="Download MFA Documentation"
						style={{
							fontWeight: '500',
							flex: 1,
							background: '#fbbf24',
							color: 'white',
						}}
					>
						📚 Docs
					</button>
					{showRestartFlow && (
						<button
							type="button"
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
							type="button"
							onClick={() => navigateToMfaHubWithCleanup(navigate)}
							className="nav-link-btn"
							title="Back to MFA Hub"
							style={{
								fontWeight: '500',
								flex: 1,
								background: '#3b82f6',
								color: 'white',
								border: '2px solid #3b82f6',
							}}
						>
							🏠 Back to Main
						</button>
					)}
					<div className="nav-link-btn api-display-wrapper" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<ApiDisplayCheckbox />
					</div>
				</div>
			</div>
			<MFADocumentationModalV8
				isOpen={showDocsModal}
				onClose={() => setShowDocsModal(false)}
			/>
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
					border: 2px solid transparent;
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
					min-width: 0;
					flex: 1;
				}

				.nav-link-btn:first-child {
					border-top-left-radius: 6px;
					border-bottom-left-radius: 6px;
				}

				.mfa-nav-links > .nav-link-btn:last-of-type,
				.mfa-nav-links > .api-display-wrapper:last-of-type {
					border-top-right-radius: 6px;
					border-bottom-right-radius: 6px;
					border-right: none;
				}

				.nav-link-btn.active {
					border: 2px solid #3b82f6;
					background: #f3f4f6;
					color: #3b82f6;
					z-index: 1;
					position: relative;
				}

				.nav-link-btn:hover {
					background: #e5e7eb;
					color: #3b82f6;
				}

				.nav-link-btn:first-child:hover {
					background: #2563eb;
					color: white;
					border-color: #2563eb;
				}

				.nav-link-btn.active:hover {
					background: #f3f4f6;
					border-color: #3b82f6;
				}

				.nav-link-btn:first-child.active:hover {
					background: #2563eb;
					color: white;
					border-color: #2563eb;
				}

				.nav-link-btn.restart-btn:hover {
					color: #ef4444;
				}

				.api-display-wrapper {
					background: #f3f4f6;
					border: 2px solid transparent;
					border-right: 1px solid #e5e7eb;
					cursor: default;
				}

				.api-display-wrapper:hover {
					background: #f3f4f6;
				}
			`}</style>
		</>
	);
};
