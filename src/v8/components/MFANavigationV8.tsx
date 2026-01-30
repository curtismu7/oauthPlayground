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
import { useLocation, useNavigate } from 'react-router-dom';
import { uiNotificationServiceV8 } from '@/v8/services/uiNotificationServiceV8';
import { navigateToMfaHubWithCleanup } from '@/v8/utils/mfaFlowCleanupV8';
import { MFADocumentationModalV8 } from './MFADocumentationModalV8';
import { ApiDisplayCheckbox } from './SuperSimpleApiDisplayV8';

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
	const location = useLocation();
	const [showDocsModal, setShowDocsModal] = useState(false);

	// Check if we're on the unified MFA flow
	const isUnifiedFlow = location.pathname.includes('/v8/mfa-unified');

	const handleBackToMain = () => {
		if (isUnifiedFlow) {
			// If on unified flow, navigate to unified flow start (step 0)
			navigate('/v8/mfa-unified', {
				state: location.state,
				replace: true,
			});
			// Reload to reset to step 0
			window.location.reload();
		} else {
			// Otherwise, navigate to MFA hub
			navigateToMfaHubWithCleanup(navigate);
		}
	};

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
						gap: '6px',
						flex: 1,
						alignItems: 'center',
						width: '100%',
					}}
				>
					<button
						type="button"
						onClick={handleBackToMain}
						className={`nav-link-btn nav-btn-hub ${currentPage === 'hub' ? 'active' : ''}`}
						title={isUnifiedFlow ? 'Restart Unified Flow' : 'Go to MFA Hub'}
						style={{
							fontWeight: currentPage === 'hub' ? '600' : '500',
							flex: 1,
							background: currentPage === 'hub' ? '#3b82f6' : '#f3f4f6',
							color: currentPage === 'hub' ? 'white' : '#1f2937',
							border: '2px solid #3b82f6',
							boxShadow: currentPage === 'hub' ? '0 0 0 3px rgba(59, 130, 246, 0.3)' : 'none',
						}}
					>
						🏠 {isUnifiedFlow ? 'Restart Flow' : 'MFA Hub'}
					</button>
					<button
						type="button"
						onClick={() => navigate('/v8/mfa-device-management')}
						className={`nav-link-btn nav-btn-management ${currentPage === 'management' ? 'active' : ''}`}
						title="Manage MFA Devices"
						style={{
							fontWeight: currentPage === 'management' ? '600' : '500',
							flex: 1,
							background: currentPage === 'management' ? '#10b981' : '#f3f4f6',
							color: currentPage === 'management' ? 'white' : '#1f2937',
							border: '2px solid #10b981',
							boxShadow:
								currentPage === 'management' ? '0 0 0 3px rgba(16, 185, 129, 0.3)' : 'none',
						}}
					>
						🔧 Device Management
					</button>
					<button
						type="button"
						onClick={() => navigate('/v8/mfa-device-ordering')}
						className={`nav-link-btn nav-btn-ordering ${currentPage === 'ordering' ? 'active' : ''}`}
						title="Configure MFA device ordering"
						style={{
							fontWeight: currentPage === 'ordering' ? '600' : '500',
							flex: 1,
							background: currentPage === 'ordering' ? '#f59e0b' : '#f3f4f6',
							color: currentPage === 'ordering' ? 'white' : '#1f2937',
							border: '2px solid #f59e0b',
							boxShadow: currentPage === 'ordering' ? '0 0 0 3px rgba(245, 158, 11, 0.3)' : 'none',
						}}
					>
						📋 Device Ordering
					</button>
					<button
						type="button"
						onClick={() => navigate('/v8/mfa-reporting')}
						className={`nav-link-btn nav-btn-reporting ${currentPage === 'reporting' ? 'active' : ''}`}
						title="View MFA Reports"
						style={{
							fontWeight: currentPage === 'reporting' ? '600' : '500',
							flex: 1,
							background: currentPage === 'reporting' ? '#8b5cf6' : '#f3f4f6',
							color: currentPage === 'reporting' ? 'white' : '#1f2937',
							border: '2px solid #8b5cf6',
							boxShadow: currentPage === 'reporting' ? '0 0 0 3px rgba(139, 92, 246, 0.3)' : 'none',
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
							background: currentPage === 'settings' ? '#06b6d4' : '#f3f4f6',
							color: currentPage === 'settings' ? 'white' : '#1f2937',
							border: '2px solid #06b6d4',
							boxShadow: currentPage === 'settings' ? '0 0 0 3px rgba(6, 182, 212, 0.3)' : 'none',
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
					{showBackToMain && !isUnifiedFlow && (
						<button
							type="button"
							onClick={handleBackToMain}
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
					<div
						className="nav-link-btn api-display-wrapper"
						style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
					>
						<ApiDisplayCheckbox />
					</div>
				</div>
			</div>
			<MFADocumentationModalV8 isOpen={showDocsModal} onClose={() => setShowDocsModal(false)} />
			<style>{`
				.mfa-nav-links {
					display: flex;
					gap: 6px;
					flex-wrap: nowrap;
					width: 100%;
				}

				.nav-link-btn {
					padding: 8px 12px;
					background: #f3f4f6;
					color: #1f2937;
					border: 2px solid transparent;
					border-radius: 6px;
					font-size: 12px;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 4px;
					text-align: center;
					min-width: fit-content;
					flex: 1;
					height: 40px;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				/* Different colored outlines for each button */
				.nav-btn-hub {
					border-color: #3b82f6 !important;
				}

				.nav-btn-management {
					border-color: #10b981 !important;
				}

				.nav-btn-ordering {
					border-color: #f59e0b !important;
				}

				.nav-btn-reporting {
					border-color: #8b5cf6 !important;
				}

				.nav-btn-config {
					border-color: #06b6d4 !important;
				}

				.nav-btn-docs {
					border-color: #fbbf24 !important;
				}

				.nav-btn-back {
					border-color: #3b82f6 !important;
				}

				.nav-btn-restart {
					border-color: #ef4444 !important;
				}

				.nav-link-btn.active {
					background: #f3f4f6;
					color: #1f2937;
					font-weight: 600;
				}

				.nav-link-btn:hover {
					background: #e5e7eb;
					transform: translateY(-1px);
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
				}

				/* Active state overrides */
				.nav-btn-hub.active,
				.nav-btn-back {
					background: #3b82f6;
					color: white;
				}

				.nav-btn-docs {
					background: #fbbf24;
					color: white;
				}

				.nav-btn-restart {
					background: #f3f4f6;
					color: #ef4444;
				}

				.nav-btn-restart:hover {
					background: #fee2e2;
				}

				.api-display-wrapper {
					cursor: default;
				}

				.api-display-wrapper:hover {
					background: #f3f4f6;
					transform: none;
					box-shadow: none;
				}
			`}</style>
		</>
	);
};
