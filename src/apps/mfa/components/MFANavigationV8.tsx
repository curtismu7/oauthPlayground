/**
 * @file MFANavigationV8.tsx
 * @module apps/mfa/components
 * @description MFA Navigation Component - MFA COMPONENT
 * @version 8.0.0
 * @since 2024-11-19
 *
 * Navigation component for MFA flows with step indicators
 * and progress tracking.
 * Reusable navigation bar component that can be added to any MFA page
 * Includes navigation links, Back to Main button, and Show API Calls toggle.
 * All buttons are displayed on one line within a bordered container box.
 *
 * @example
 * // Add to any MFA page at the top
 * <MFANavigationV8 currentPage="hub" showBackToMain={true} />
 */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BootstrapButton from '@/components/bootstrap/BootstrapButton';
import { uiNotificationServiceV8 } from '@/v8/services/uiNotificationServiceV8';
import { navigateToMfaHubWithCleanup } from '@/v8/utils/mfaFlowCleanupV8';
import { MFADocumentationModalV8 } from './MFADocumentationModalV8';
import { ApiDisplayCheckbox } from './SuperSimpleApiDisplayV8';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../styles/bootstrap/pingone-bootstrap.css';

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
	const isUnifiedFlow = location.pathname.includes('/v8/unified-mfa');

	const handleBackToMain = () => {
		if (isUnifiedFlow) {
			// If on unified flow, navigate to unified flow start (step 0)
			navigate('/v8/unified-mfa', {
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
			<div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-white border rounded-2 shadow-sm">
				<div className="mfa-nav-links mb-0 d-flex gap-2 flex-1 align-items-center w-100">
					<BootstrapButton
						variant={currentPage === 'hub' ? 'primary' : 'secondary'}
						onClick={handleBackToMain}
						className={`flex-1 ${currentPage === 'hub' ? 'border-white' : ''}`}
						title={isUnifiedFlow ? 'Restart Unified Flow' : 'Go to MFA Hub'}
						whiteBorder={currentPage === 'hub'}
					>
						🏠 {isUnifiedFlow ? 'Restart Flow' : 'MFA Hub'}
					</BootstrapButton>
					<BootstrapButton
						variant={currentPage === 'management' ? 'success' : 'secondary'}
						onClick={() => navigate('/v8/mfa-device-management')}
						className={`flex-1 ${currentPage === 'management' ? 'border-white' : ''}`}
						title="Manage MFA Devices"
						whiteBorder={currentPage === 'management'}
					>
						🔧 Device Management
					</BootstrapButton>
					<BootstrapButton
						variant={currentPage === 'ordering' ? 'warning' : 'secondary'}
						onClick={() => navigate('/v8/mfa-device-ordering')}
						className={`flex-1 ${currentPage === 'ordering' ? 'border-white' : ''}`}
						title="Configure MFA device ordering"
						whiteBorder={currentPage === 'ordering'}
					>
						📋 Device Ordering
					</BootstrapButton>
					<BootstrapButton
						variant={currentPage === 'reporting' ? 'info' : 'secondary'}
						onClick={() => navigate('/v8/mfa-reporting')}
						className={`flex-1 ${currentPage === 'reporting' ? 'border-white' : ''}`}
						title="View MFA Reports"
						whiteBorder={currentPage === 'reporting'}
					>
						📊 Reporting
					</BootstrapButton>
					<BootstrapButton
						variant={currentPage === 'settings' ? 'primary' : 'secondary'}
						onClick={() => navigate('/v8/mfa-config')}
						className={`flex-1 ${currentPage === 'settings' ? 'border-white' : ''}`}
						title="MFA Configuration"
						whiteBorder={currentPage === 'settings'}
					>
						⚙️ MFA Config
					</BootstrapButton>
					<BootstrapButton
						variant="warning"
						onClick={() => setShowDocsModal(true)}
						className="flex-1 border-white"
						title="Download MFA Documentation"
						whiteBorder={true}
					>
						📚 Documentation
					</BootstrapButton>
					{showRestartFlow && (
						<BootstrapButton
							variant="danger"
							onClick={handleRestartFlow}
							className="flex-1"
							title="Restart the flow from the beginning"
							style={{ opacity: 0.8 }}
						>
							🔄 Restart Flow
						</BootstrapButton>
					)}
					{showBackToMain && !isUnifiedFlow && (
						<button
							type="button"
							onClick={handleBackToMain}
							className="nav-link-btn"
							title={isUnifiedFlow ? 'Restart Unified Flow' : 'Back to MFA Hub'}
							style={{
								fontWeight: '500',
								flex: 1,
								background: '#3b82f6',
								color: 'white',
								border: '2px solid #3b82f6',
							}}
						>
							🏠 {isUnifiedFlow ? 'Restart Flow' : 'Back to Main'}
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
