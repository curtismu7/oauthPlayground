/**
 * @file UnifiedNavigationV8U.tsx
 * @module v8u/components
 * @description Shared navigation component for all Unified OAuth/OIDC flows
 * @version 1.0.0
 *
 * Reusable navigation bar component that can be added to any Unified flow page for consistency.
 * Includes navigation links to different flow types, Docs button, Back to Main button, and Show API Calls toggle.
 * All buttons are displayed on one line within a bordered container box.
 *
 * @example
 * // Add to any Unified flow page at the top
 * <UnifiedNavigationV8U currentFlowType="oauth-authz" showBackToMain={true} />
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { ApiDisplayCheckbox } from '@/v8/components/SuperSimpleApiDisplayV8';
import type { FlowType } from '@/v8/services/specVersionServiceV8';
import { PKCEStorageServiceV8U } from '../services/pkceStorageServiceV8U';
import { UnifiedDocumentationModalV8U } from './UnifiedDocumentationModalV8U';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';

interface UnifiedNavigationV8UProps {
	/** Current flow type for highlighting */
	currentFlowType?: FlowType;
	/** Show back to main button */
	showBackToMain?: boolean;
}

export const UnifiedNavigationV8U: React.FC<UnifiedNavigationV8UProps> = ({
	currentFlowType,
	showBackToMain = true,
}) => {
	const navigate = useNavigate();
	const [showDocsModal, setShowDocsModal] = useState(false);

	const flowTypeLabels: Partial<Record<FlowType, { label: string; icon: string; path: string }>> = {
		'oauth-authz': {
			label: 'Authorization Code',
			icon: '🔐',
			path: '/v8u/unified/oauth-authz/0',
		},
		implicit: {
			label: 'Implicit',
			icon: '⚡',
			path: '/v8u/unified/implicit/0',
		},
		'client-credentials': {
			label: 'Client Credentials',
			icon: '🔑',
			path: '/v8u/unified/client-credentials/0',
		},
		'device-code': {
			label: 'Device Code',
			icon: '📱',
			path: '/v8u/unified/device-code/0',
		},
		hybrid: {
			label: 'Hybrid',
			icon: '🔀',
			path: '/v8u/unified/hybrid/0',
		},
	};

	/**
	 * Clear all flow state before navigating
	 * This ensures a clean slate when switching between flows or going back to main
	 */
	const clearFlowState = () => {
		// Clear session storage items
		sessionStorage.removeItem('v8u_callback_data');
		sessionStorage.removeItem('v8u_implicit_tokens');
		sessionStorage.removeItem('v8u_device_code_data');
		sessionStorage.removeItem('v8u_client_credentials_tokens');

		// Clear all flow-specific token keys
		const allPossibleTokenKeys = [
			'v8u_oauth-authz_tokens',
			'v8u_implicit_tokens',
			'v8u_hybrid_tokens',
			'v8u_client-credentials_tokens',
			'v8u_device-code_tokens',
		];

		allPossibleTokenKeys.forEach((key) => {
			sessionStorage.removeItem(key);
		});

		// Clear PKCE codes for all possible flow keys
		const specVersions = ['oauth2.0', 'oidc', 'oauth2.1'];
		const flowTypes: FlowType[] = [
			'oauth-authz',
			'implicit',
			'client-credentials',
			'device-code',
			'hybrid',
		];

		specVersions.forEach((spec) => {
			flowTypes.forEach((flow) => {
				const flowKey = `${spec}-${flow}-v8u`;
				PKCEStorageServiceV8U.clearPKCECodes(flowKey).catch((err) => {
					logger.warn(`Failed to clear PKCE codes for ${flowKey}:`, err);
				});
			});
		});

		// Clear API calls
		apiCallTrackerService.clearApiCalls();

		// Clear any potential ConfigChecker-related state or cached data
		try {
			// Clear any comparison results or cached application data
			sessionStorage.removeItem('config-checker-diffs');
			sessionStorage.removeItem('config-checker-last-check');
			sessionStorage.removeItem('pingone-app-cache');
			localStorage.removeItem('pingone-applications-cache');

			// Clear any worker token related cache that might be used for pre-flight checks
			sessionStorage.removeItem('worker-token-cache');
			localStorage.removeItem('worker-apps-cache');

			logger.debug(
				'🔄 [UnifiedNavigationV8U] Clearing flow state: cleared ConfigChecker and pre-flight cache data'
			);
		} catch (error) {
			logger.warn('[UnifiedNavigationV8U] Failed to clear cache data:', error);
		}
	};

	const handleNavigateToFlow = (flowType: FlowType) => {
		// Clear state before navigating
		clearFlowState();

		const flowInfo = flowTypeLabels[flowType];
		if (flowInfo) {
			// Navigate to step 0 of the selected flow
			// This will trigger the URL sync in UnifiedOAuthFlowV8U which will
			// handle spec version compatibility automatically
			navigate(flowInfo.path);
		}
	};

	const handleBackToMain = () => {
		// Clear state before navigating to main page
		clearFlowState();
		navigate('/v8u/unified');
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
					maxWidth: '100%',
					width: '100%',
				}}
			>
				<div
					className="unified-nav-links"
					style={{
						marginBottom: 0,
						display: 'flex',
						gap: '6px',
						flex: 1,
						alignItems: 'center',
						width: '100%',
					}}
				>
					{!currentFlowType && (
						<button
							type="button"
							onClick={handleBackToMain}
							className="nav-link-btn active nav-btn-hub"
							title="Unified Flow Hub (Current Page)"
							style={{
								fontWeight: '600',
								flex: 1,
								background: '#3b82f6',
								color: 'white',
								border: '2px solid #3b82f6',
							}}
						>
							🏠 Unified Hub
						</button>
					)}
					<button
						type="button"
						onClick={() => handleNavigateToFlow('oauth-authz')}
						className={`nav-link-btn nav-btn-authz ${currentFlowType === 'oauth-authz' ? 'active' : ''}`}
						title="OAuth 2.0 Authorization Code Flow"
						style={{
							fontWeight: currentFlowType === 'oauth-authz' ? '600' : '500',
							flex: 1,
						}}
					>
						🔐 Authorization Code
					</button>
					<button
						type="button"
						onClick={() => handleNavigateToFlow('implicit')}
						className={`nav-link-btn nav-btn-implicit ${currentFlowType === 'implicit' ? 'active' : ''}`}
						title="OAuth 2.0 Implicit Flow"
						style={{
							fontWeight: currentFlowType === 'implicit' ? '600' : '500',
							flex: 1,
						}}
					>
						⚡ Implicit
					</button>
					<button
						type="button"
						onClick={() => handleNavigateToFlow('client-credentials')}
						className={`nav-link-btn nav-btn-client-creds ${currentFlowType === 'client-credentials' ? 'active' : ''}`}
						title="OAuth 2.0 Client Credentials Flow"
						style={{
							fontWeight: currentFlowType === 'client-credentials' ? '600' : '500',
							flex: 1,
						}}
					>
						🔑 Client Credentials
					</button>
					<button
						type="button"
						onClick={() => handleNavigateToFlow('device-code')}
						className={`nav-link-btn nav-btn-device ${currentFlowType === 'device-code' ? 'active' : ''}`}
						title="OAuth 2.0 Device Authorization Flow"
						style={{
							fontWeight: currentFlowType === 'device-code' ? '600' : '500',
							flex: 1,
						}}
					>
						📱 Device Code
					</button>
					<button
						type="button"
						onClick={() => handleNavigateToFlow('hybrid')}
						className={`nav-link-btn nav-btn-hybrid ${currentFlowType === 'hybrid' ? 'active' : ''}`}
						title="OpenID Connect Hybrid Flow"
						style={{
							fontWeight: currentFlowType === 'hybrid' ? '600' : '500',
							flex: 1,
						}}
					>
						🔀 Hybrid
					</button>
					<button
						type="button"
						onClick={() => setShowDocsModal(true)}
						className="nav-link-btn nav-btn-docs"
						title="Download Unified Flow Documentation"
						style={{
							fontWeight: '500',
							flex: 1,
							background: '#fbbf24',
							color: 'white',
							border: '2px solid #fbbf24',
						}}
					>
						📚 Docs
					</button>
					{showBackToMain && currentFlowType && (
						<button
							type="button"
							onClick={handleBackToMain}
							className="nav-link-btn nav-btn-back"
							title="Back to Unified Flow Hub"
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
						style={{
							flex: '0 0 auto',
							minWidth: '120px',
							maxWidth: '180px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							background: '#f3f4f6',
							border: '2px solid transparent',
							borderRadius: '6px',
							padding: '10px 8px',
							overflow: 'hidden',
						}}
					>
						<ApiDisplayCheckbox />
					</div>
				</div>
			</div>
			<style>{`
				.unified-nav-links {
					display: flex;
					gap: 8px;
					flex-wrap: nowrap;
					width: 100%;
				}

			.nav-link-btn {
				padding: 8px 10px;
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
				min-width: 0;
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

				.nav-btn-authz {
					border-color: #8b5cf6 !important;
				}

				.nav-btn-implicit {
					border-color: #f59e0b !important;
				}

				.nav-btn-client-creds {
					border-color: #10b981 !important;
				}

				.nav-btn-device {
					border-color: #ec4899 !important;
				}

				.nav-btn-hybrid {
					border-color: #06b6d4 !important;
				}

				.nav-btn-docs {
					border-color: #fbbf24 !important;
				}

				.nav-btn-back {
					border-color: #3b82f6 !important;
				}

				.nav-link-btn:first-child {
					border-top-left-radius: 6px;
					border-bottom-left-radius: 6px;
				}

				.unified-nav-links > .nav-link-btn:last-of-type,
				.unified-nav-links > .api-display-wrapper:last-of-type {
					border-top-right-radius: 6px;
					border-bottom-right-radius: 6px;
				}

				.nav-link-btn.active {
					border: 2px solid #3b82f6;
					background: #eff6ff;
					color: #3b82f6;
					z-index: 1;
					position: relative;
					font-weight: 600;
				}

				.nav-link-btn.active[style*="background: #3b82f6"],
				.nav-link-btn.active[style*="background: rgb(59, 130, 246)"] {
					background: #3b82f6 !important;
					color: white !important;
					border-color: #3b82f6 !important;
				}

				.nav-link-btn.active[style*="background: #fbbf24"],
				.nav-link-btn.active[style*="background: rgb(251, 191, 36)"] {
					background: #fbbf24 !important;
					color: white !important;
					border-color: #fbbf24 !important;
				}

				.nav-link-btn:hover:not(.api-display-wrapper) {
					background: #e5e7eb;
					color: #3b82f6;
					transform: translateY(-1px);
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
				}

				.nav-link-btn[style*="background: #3b82f6"]:hover,
				.nav-link-btn[style*="background: rgb(59, 130, 246)"]:hover {
					background: #2563eb !important;
					color: white !important;
					border-color: #2563eb !important;
				}

				.nav-link-btn[style*="background: #fbbf24"]:hover,
				.nav-link-btn[style*="background: rgb(251, 191, 36)"]:hover {
					background: #f59e0b !important;
					border-color: #f59e0b !important;
				}

				.nav-link-btn.active:hover:not([style*="background: #3b82f6"]):not([style*="background: rgb(59, 130, 246)"]) {
					background: #eff6ff;
					border-color: #3b82f6;
				}

				.api-display-wrapper {
					background: #f3f4f6;
					border: 2px solid #6366f1 !important;
					border-radius: 6px;
					cursor: default;
					height: 44px;
					flex-shrink: 0;
				}

				.api-display-wrapper:hover {
					background: #f3f4f6;
				}

				.api-display-wrapper label {
					margin: 0;
					padding: 0;
					background: transparent !important;
					border: none !important;
					border-radius: 0 !important;
					font-size: 13px !important;
					font-weight: 500 !important;
					color: #1f2937 !important;
					display: flex !important;
					align-items: center !important;
					gap: 6px !important;
					cursor: pointer !important;
					width: 100%;
					justify-content: center;
					min-width: 0;
				}

				.api-display-wrapper label span {
					font-size: 13px !important;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					max-width: 100%;
				}

				.api-display-wrapper input[type="checkbox"] {
					width: 14px !important;
					height: 14px !important;
					flex-shrink: 0;
				}
			`}</style>
			<UnifiedDocumentationModalV8U
				isOpen={showDocsModal}
				onClose={() => setShowDocsModal(false)}
			/>
		</>
	);
};
