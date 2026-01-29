/**
 * @file WorkerTokenSectionV8.tsx
 * @module v8/components/sections
 * @description Worker Token Configuration Section Component
 * @version 3.0.0
 *
 * Extracted from MFAAuthenticationMainPageV8.tsx as part of V3 refactoring.
 * This component handles the worker token configuration UI including:
 * - Worker token status display
 * - Get Worker Token button
 * - Configuration checkboxes (silent retrieval, show token)
 * - Environment and username inputs
 * - Collapsible section
 */

import React, { useState } from 'react';
import WorkerTokenStatusDisplayV8 from '@/v8/components/WorkerTokenStatusDisplayV8';
import type { UseWorkerTokenReturn } from '@/v8/hooks/useWorkerToken';

export interface WorkerTokenSectionProps {
	/** Worker token hook return value */
	workerToken: UseWorkerTokenReturn;
	/** Environment ID */
	environmentId: string;
	/** Username */
	username: string;
	/** Callback when environment changes */
	onEnvironmentChange: (value: string) => void;
	/** Callback when username changes */
	onUsernameChange: (value: string) => void;
	/** Whether getting worker token is in progress */
	isGettingWorkerToken?: boolean;
	/** Callback when get worker token is clicked */
	onGetWorkerToken?: () => Promise<void>;
}

const MODULE_TAG = '[🔐 WORKER-TOKEN-SECTION-V8]';

/**
 * Worker Token Configuration Section Component
 * Displays worker token status and configuration options
 */
export const WorkerTokenSectionV8: React.FC<WorkerTokenSectionProps> = ({
	workerToken,
	environmentId,
	username,
	onEnvironmentChange,
	onUsernameChange,
	isGettingWorkerToken = false,
	onGetWorkerToken,
}) => {
	const [isCollapsed, setIsCollapsed] = useState(false);

	return (
		<div
			style={{
				background: 'white',
				borderRadius: '8px',
				padding: '24px',
				marginBottom: '24px',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
				border: '1px solid #e5e7eb',
			}}
		>
			{/* Collapsible Header */}
			<button
				type="button"
				onClick={() => setIsCollapsed(!isCollapsed)}
				style={{
					width: '100%',
					padding: '12px 16px',
					background: 'transparent',
					border: 'none',
					cursor: 'pointer',
					display: 'flex',
					alignItems: 'center',
					gap: '12px',
					transition: 'all 0.2s ease',
					marginBottom: '16px',
				}}
			>
				<div
					style={{
						width: '24px',
						height: '24px',
						background: '#3b82f6',
						borderRadius: '4px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						transition: 'all 0.2s ease',
						flexShrink: 0,
					}}
				>
					<span
						style={{
							color: 'white',
							fontSize: '12px',
							transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
							transition: 'transform 0.2s ease',
							display: 'inline-block',
						}}
					>
						▶
					</span>
				</div>
				<span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
					Worker Token Configuration
				</span>
			</button>

			{/* Worker Token Content */}
			{!isCollapsed && (
				<div>
					{/* Worker Token Status & Actions */}
					<div style={{ marginBottom: '24px' }}>
						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '16px',
								alignItems: 'flex-start',
							}}
						>
							<button
								type="button"
								onClick={onGetWorkerToken}
								disabled={isGettingWorkerToken}
								style={{
									padding: '8px 16px',
									border: 'none',
									borderRadius: '6px',
									background:
										workerToken.tokenStatus.status === 'expiring-soon'
											? '#f59e0b'
											: workerToken.tokenStatus.isValid
												? '#10b981'
												: '#dc2626',
									color: 'white',
									cursor: isGettingWorkerToken ? 'not-allowed' : 'pointer',
									fontWeight: '500',
									fontSize: '14px',
									transition: 'all 0.2s ease',
									opacity: isGettingWorkerToken ? 0.6 : 1,
								}}
							>
								{isGettingWorkerToken ? '⏳ Getting Token...' : '🔑 Get Worker Token'}
							</button>

							<WorkerTokenStatusDisplayV8 mode="detailed" showRefresh={true} refreshInterval={5} />
						</div>
					</div>

					{/* Worker Token Settings */}
					<div style={{ marginBottom: '24px' }}>
						<h3
							style={{
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
								marginBottom: '12px',
							}}
						>
							Worker Token Settings
						</h3>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
							<label
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									cursor: 'pointer',
									fontSize: '14px',
									color: '#4b5563',
								}}
							>
								<input
									type="checkbox"
									checked={workerToken.silentApiRetrieval}
									onChange={(e) => {
										workerToken.setSilentApiRetrieval(e.target.checked);
										console.log(
											`${MODULE_TAG} Silent API retrieval ${e.target.checked ? 'enabled' : 'disabled'}`
										);
									}}
									style={{
										width: '16px',
										height: '16px',
										cursor: 'pointer',
									}}
								/>
								<span>Silent API Retrieval (auto-refresh token)</span>
							</label>

							<label
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									cursor: 'pointer',
									fontSize: '14px',
									color: '#4b5563',
								}}
							>
								<input
									type="checkbox"
									checked={workerToken.showTokenAtEnd}
									onChange={(e) => {
										workerToken.setShowTokenAtEnd(e.target.checked);
										console.log(
											`${MODULE_TAG} Show token at end ${e.target.checked ? 'enabled' : 'disabled'}`
										);
									}}
									style={{
										width: '16px',
										height: '16px',
										cursor: 'pointer',
									}}
								/>
								<span>Show Token at End</span>
							</label>
						</div>
					</div>

					{/* Environment & Username */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<div>
							<label
								htmlFor="environment-id"
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '500',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Environment ID
							</label>
							<input
								id="environment-id"
								type="text"
								value={environmentId}
								onChange={(e) => onEnvironmentChange(e.target.value)}
								placeholder="Enter PingOne Environment ID"
								style={{
									width: '100%',
									padding: '8px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									outline: 'none',
								}}
							/>
						</div>

						<div>
							<label
								htmlFor="username"
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '500',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Username
							</label>
							<input
								id="username"
								type="text"
								value={username}
								onChange={(e) => onUsernameChange(e.target.value)}
								placeholder="Enter username"
								style={{
									width: '100%',
									padding: '8px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									outline: 'none',
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default WorkerTokenSectionV8;
