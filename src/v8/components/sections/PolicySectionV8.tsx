/**
 * @file PolicySectionV8.tsx
 * @module v8/components/sections
 * @description Policy Section Component
 * @version 3.0.0
 *
 * Extracted from MFAAuthenticationMainPageV8.tsx as part of V3 refactoring.
 * This component handles the policy management UI including:
 * - Policy list display
 * - Policy selection
 * - Policy refresh
 * - Default policy indicator
 * - Loading states
 * - Error handling
 */

import React from 'react';
import type { UseMFAPoliciesReturn } from '@/v8/hooks/useMFAPolicies';

export interface PolicySectionProps {
	/** MFA policies hook return value */
	mfaPolicies: UseMFAPoliciesReturn;
	/** Callback when policy is selected */
	onPolicySelect?: (policyId: string) => void;
	/** Callback when refresh policies is clicked */
	onRefreshPolicies?: () => Promise<void>;
	/** Show policy details */
	showDetails?: boolean;
}

/**
 * Policy Section Component
 * Displays policy list and selection controls
 */
export const PolicySectionV8: React.FC<PolicySectionProps> = ({
	mfaPolicies,
	onPolicySelect,
	onRefreshPolicies,
	showDetails = true,
}) => {
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
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '20px',
				}}
			>
				<h2
					style={{
						fontSize: '18px',
						fontWeight: '600',
						color: '#1f2937',
						margin: 0,
					}}
				>
					🛡️ Device Authentication Policies
				</h2>
				<button
					type="button"
					onClick={onRefreshPolicies}
					disabled={mfaPolicies.isLoading}
					style={{
						padding: '8px 16px',
						border: '1px solid #d1d5db',
						borderRadius: '6px',
						background: 'white',
						color: '#374151',
						cursor: mfaPolicies.isLoading ? 'not-allowed' : 'pointer',
						fontWeight: '500',
						fontSize: '14px',
						transition: 'all 0.2s ease',
						opacity: mfaPolicies.isLoading ? 0.6 : 1,
					}}
				>
					{mfaPolicies.isLoading ? '⏳ Loading...' : '🔄 Refresh'}
				</button>
			</div>

			{/* Loading State */}
			{mfaPolicies.isLoading && (
				<div
					style={{
						padding: '40px 20px',
						textAlign: 'center',
						color: '#6b7280',
					}}
				>
					<div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
					<p style={{ margin: 0, fontSize: '14px' }}>Loading policies...</p>
				</div>
			)}

			{/* Error State */}
			{mfaPolicies.error && !mfaPolicies.isLoading && (
				<div
					style={{
						padding: '16px',
						background: '#fef2f2',
						border: '1px solid #dc2626',
						borderRadius: '6px',
						marginBottom: '16px',
					}}
				>
					<p style={{ fontSize: '14px', color: '#991b1b', margin: 0 }}>⚠️ {mfaPolicies.error}</p>
				</div>
			)}

			{/* No Policies State */}
			{!mfaPolicies.isLoading && !mfaPolicies.error && !mfaPolicies.hasPolicies && (
				<div
					style={{
						padding: '40px 20px',
						textAlign: 'center',
						color: '#6b7280',
					}}
				>
					<div style={{ fontSize: '32px', marginBottom: '12px' }}>🛡️</div>
					<p style={{ margin: 0, fontSize: '14px' }}>No policies found</p>
					<p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>
						Policies will appear here once loaded
					</p>
				</div>
			)}

			{/* Policies List */}
			{!mfaPolicies.isLoading && mfaPolicies.hasPolicies && (
				<div>
					<div
						style={{
							padding: '12px 16px',
							background: '#f0fdf4',
							border: '1px solid #10b981',
							borderRadius: '6px',
							marginBottom: '16px',
						}}
					>
						<p style={{ fontSize: '14px', color: '#065f46', margin: 0 }}>
							✅ {mfaPolicies.policyCount} polic{mfaPolicies.policyCount !== 1 ? 'ies' : 'y'} loaded
						</p>
					</div>

					{showDetails && (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
							{mfaPolicies.policies.map((policy) => {
								const isSelected = mfaPolicies.selectedPolicy?.id === policy.id;
								const isDefault = mfaPolicies.defaultPolicy?.id === policy.id;

								return (
									<div
										role="button"
										tabIndex={0}
										key={policy.id}
										onClick={() => {
											if (onPolicySelect) {
												onPolicySelect(policy.id);
											}
											mfaPolicies.selectPolicy(policy.id);
										}}
										style={{
											padding: '16px',
											border: isSelected ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
											borderRadius: '8px',
											background: isSelected ? '#f5f3ff' : 'white',
											cursor: 'pointer',
											transition: 'all 0.2s ease',
										}}
									>
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'flex-start',
											}}
										>
											<div style={{ flex: 1 }}>
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '8px',
														marginBottom: '4px',
													}}
												>
													<div
														style={{
															fontSize: '15px',
															fontWeight: '600',
															color: '#1f2937',
														}}
													>
														{policy.name}
													</div>
													{isDefault && (
														<div
															style={{
																display: 'inline-block',
																padding: '2px 8px',
																borderRadius: '4px',
																fontSize: '11px',
																fontWeight: '600',
																background: '#fef3c7',
																color: '#92400e',
															}}
														>
															DEFAULT
														</div>
													)}
												</div>
												{policy.description && (
													<div
														style={{
															fontSize: '13px',
															color: '#6b7280',
															marginBottom: '8px',
														}}
													>
														{policy.description}
													</div>
												)}
												<div
													style={{
														display: 'inline-block',
														padding: '4px 8px',
														borderRadius: '4px',
														fontSize: '12px',
														fontWeight: '500',
														background: policy.status === 'ENABLED' ? '#d1fae5' : '#f3f4f6',
														color: policy.status === 'ENABLED' ? '#065f46' : '#6b7280',
													}}
												>
													{policy.status || 'UNKNOWN'}
												</div>
											</div>
											{isSelected && (
												<div
													style={{
														fontSize: '20px',
														color: '#8b5cf6',
													}}
												>
													✓
												</div>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default PolicySectionV8;
