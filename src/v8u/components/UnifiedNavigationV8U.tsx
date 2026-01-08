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

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { FlowType } from '@/v8/services/specVersionServiceV8';
import { ApiDisplayCheckbox } from '@/v8/components/SuperSimpleApiDisplayV8';

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

	const handleNavigateToFlow = (flowType: FlowType) => {
		const flowInfo = flowTypeLabels[flowType];
		if (flowInfo) {
			navigate(flowInfo.path);
		}
	};

	const handleBackToMain = () => {
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
				}}
			>
				<div
					className="unified-nav-links"
					style={{
						marginBottom: 0,
						display: 'flex',
						gap: '0',
						flex: 1,
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<button
						type="button"
						onClick={handleBackToMain}
						className={`nav-link-btn ${!currentFlowType ? 'active' : ''}`}
						title="Go to Unified Flow Hub"
						style={{
							fontWeight: !currentFlowType ? '600' : '500',
							flex: 1,
							background: '#3b82f6',
							color: 'white',
							border: '2px solid #3b82f6',
						}}
					>
						🏠 Unified Hub
					</button>
					<button
						type="button"
						onClick={() => handleNavigateToFlow('oauth-authz')}
						className={`nav-link-btn ${currentFlowType === 'oauth-authz' ? 'active' : ''}`}
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
						className={`nav-link-btn ${currentFlowType === 'implicit' ? 'active' : ''}`}
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
						className={`nav-link-btn ${currentFlowType === 'client-credentials' ? 'active' : ''}`}
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
						className={`nav-link-btn ${currentFlowType === 'device-code' ? 'active' : ''}`}
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
						className={`nav-link-btn ${currentFlowType === 'hybrid' ? 'active' : ''}`}
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
						onClick={() => {
							// Navigate to the documentation step (last step) for the current flow
							const flow = currentFlowType || 'oauth-authz';
							// Documentation step numbers (0-indexed, last step):
							// - Client Credentials: 5 steps total (0-4), documentation at step 4
							// - Device Code: 6 steps total (0-5), documentation at step 5
							// - Implicit: 6 steps total (0-5), documentation at step 5
							// - Authorization Code/Hybrid: 8 steps total (0-7), documentation at step 7
							const docStepMap: Partial<Record<FlowType, number>> = {
								'client-credentials': 4, // Step 4 (0-indexed) = last step
								'device-code': 5, // Step 5 (0-indexed) = last step
								implicit: 5, // Step 5 (0-indexed) = last step
								'oauth-authz': 7, // Step 7 (0-indexed) = last step
								hybrid: 7, // Step 7 (0-indexed) = last step
							};
							const docStep = docStepMap[flow];
							if (docStep !== undefined) {
								navigate(`/v8u/unified/${flow}/${docStep}`);
							} else {
								console.warn(`[UnifiedNavigationV8U] No documentation step mapped for flow: ${flow}`);
							}
						}}
						className="nav-link-btn"
						title="View API Documentation"
						style={{
							fontWeight: '500',
							flex: 1,
							background: '#fbbf24',
							color: 'white',
						}}
					>
						📚 Docs
					</button>
					{showBackToMain && (
						<button
							type="button"
							onClick={handleBackToMain}
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
				.unified-nav-links {
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
				}

				.nav-link-btn:first-child {
					border-top-left-radius: 6px;
					border-bottom-left-radius: 6px;
				}

				.unified-nav-links > .nav-link-btn:last-of-type {
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
			`}</style>
		</>
	);
};
