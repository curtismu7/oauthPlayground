/**
 * @file MFAFeatureFlagsAdminV8.tsx
 * @module v8/pages
 * @description Admin UI for managing MFA feature flags
 * @version 8.0.0
 * @since 2026-01-29
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FiArrowLeft, FiFlag, FiRefreshCw, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import {
	type MFAFeatureFlag,
	MFAFeatureFlagsV8,
	type RolloutPercentage,
} from '../services/mfaFeatureFlagsV8';
import {
	disableUnifiedFlowForAll,
	disableUnifiedFlowForDevice,
	enableUnifiedFlowForAll,
	enableUnifiedFlowForDevice,
} from '../utils/mfaFeatureFlagHelpers';

export const MFAFeatureFlagsAdminV8: React.FC = () => {
	const navigate = useNavigate();
	const [flags, setFlags] = useState(MFAFeatureFlagsV8.getAllFlags());
	const [summary, setSummary] = useState(MFAFeatureFlagsV8.getFlagsSummary());
	const [isUpdating, setIsUpdating] = useState(false);

	// Use useCallback to prevent unnecessary re-renders
	const refreshFlags = useCallback(() => {
		setIsUpdating(true);
		setFlags(MFAFeatureFlagsV8.getAllFlags());
		setSummary(MFAFeatureFlagsV8.getFlagsSummary());
		setTimeout(() => setIsUpdating(false), 300);
	}, []);

	// Initial load
	useEffect(() => {
		refreshFlags();
	}, [refreshFlags]);

	// Real-time updates: polling and multi-tab sync
	useEffect(() => {
		// Poll for changes every 5 seconds
		const pollInterval = setInterval(() => {
			refreshFlags();
		}, 5000);

		// Listen for storage changes (multi-tab support)
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'mfa_feature_flags_v8') {
				console.log('[MFA-FLAGS-ADMIN] Flags changed in another tab, refreshing...');
				refreshFlags();
			}
		};

		window.addEventListener('storage', handleStorageChange);

		return () => {
			clearInterval(pollInterval);
			window.removeEventListener('storage', handleStorageChange);
		};
	}, [refreshFlags]);

	// Use Phase 8 helper utilities for consistency
	const toggleFlag = (flag: MFAFeatureFlag) => {
		const deviceType = flag.replace('mfa_unified_', '').toUpperCase();
		const current = MFAFeatureFlagsV8.getFlagState(flag);

		if (current.enabled) {
			disableUnifiedFlowForDevice(deviceType);
		} else {
			enableUnifiedFlowForDevice(deviceType, current.rolloutPercentage || 100);
		}
		refreshFlags();
	};

	const setRollout = (flag: MFAFeatureFlag, percentage: RolloutPercentage) => {
		const deviceType = flag.replace('mfa_unified_', '').toUpperCase();
		enableUnifiedFlowForDevice(deviceType, percentage);
		refreshFlags();
	};

	// Bulk operations using Phase 8 helpers
	const handleEnableAll = (percentage: RolloutPercentage) => {
		if (confirm(`Enable all devices at ${percentage}% rollout?`)) {
			enableUnifiedFlowForAll(percentage);
			refreshFlags();
		}
	};

	const handleDisableAll = () => {
		if (confirm('Disable all devices (emergency rollback)?')) {
			disableUnifiedFlowForAll();
			refreshFlags();
		}
	};

	const resetAll = () => {
		if (confirm('Reset all feature flags to defaults? This will disable all unified flows.')) {
			MFAFeatureFlagsV8.resetAllFlags();
			refreshFlags();
		}
	};

	return (
		<div style={{ minHeight: '100vh', background: '#f9fafb', padding: '32px 20px' }}>
			{/* Header */}
			<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
				<div
					style={{
						background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
						borderRadius: '12px',
						padding: '32px',
						marginBottom: '32px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: '12px',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
							<FiFlag size={32} color="white" />
							<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
								<h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'white' }}>
									MFA Feature Flags Admin
								</h1>
								{isUpdating && (
									<div
										style={{
											display: 'inline-block',
											padding: '4px 12px',
											background: 'rgba(255, 255, 255, 0.2)',
											borderRadius: '12px',
											fontSize: '12px',
											color: 'white',
											fontWeight: '600',
										}}
									>
										Updating...
									</div>
								)}
							</div>
						</div>
						<button
							type="button"
							onClick={() => navigate('/v8/mfa-hub')}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
							}}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '10px 20px',
								border: '1px solid rgba(255, 255, 255, 0.3)',
								borderRadius: '6px',
								background: 'rgba(255, 255, 255, 0.1)',
								color: 'white',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								transition: 'all 0.2s',
							}}
						>
							<FiArrowLeft size={16} />
							Back to MFA Hub
						</button>
					</div>
					<p style={{ margin: 0, fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)' }}>
						Control gradual rollout of unified MFA flows (Phase 8 - Week 7-8)
					</p>
				</div>

				{/* Info Panel */}
				<div
					style={{
						background: '#eff6ff',
						border: '1px solid #3b82f6',
						borderRadius: '8px',
						padding: '20px',
						marginBottom: '24px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
						<div
							style={{
								fontSize: '24px',
								marginTop: '-2px',
							}}
						>
							ℹ️
						</div>
						<div>
							<h3
								style={{
									margin: '0 0 8px 0',
									fontSize: '16px',
									fontWeight: '600',
									color: '#1e40af',
								}}
							>
								How Feature Flags Work
							</h3>
							<ul
								style={{
									margin: 0,
									paddingLeft: '20px',
									fontSize: '14px',
									color: '#1e3a8a',
									lineHeight: '1.6',
								}}
							>
								<li>
									<strong>0%:</strong> Disabled - all users see old flow
								</li>
								<li>
									<strong>10%:</strong> Pilot - 10% of users see new unified flow
								</li>
								<li>
									<strong>50%:</strong> Half rollout - 50% of users see new unified flow
								</li>
								<li>
									<strong>100%:</strong> Full rollout - all users see new unified flow
								</li>
								<li>
									<strong>Bucketing:</strong> Same user always gets same experience (deterministic)
								</li>
								<li>
									<strong>Instant rollback:</strong> Set to 0% to revert all users to old flow
								</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Console Commands */}
				<div
					style={{
						background: '#1f2937',
						borderRadius: '8px',
						padding: '20px',
						marginBottom: '24px',
						fontFamily: 'monospace',
						fontSize: '13px',
						color: '#d1d5db',
					}}
				>
					<div style={{ marginBottom: '12px', fontWeight: '600', color: '#f3f4f6' }}>
						Phase 8 Helper Commands (Recommended):
					</div>
					<div style={{ lineHeight: '1.8', marginBottom: '16px' }}>
						<div>
							<span style={{ color: '#10b981' }}>window.mfaHelpers</span>
							<span style={{ color: '#6b7280' }}>.enable(</span>
							<span style={{ color: '#f59e0b' }}>"SMS"</span>
							<span style={{ color: '#6b7280' }}>, </span>
							<span style={{ color: '#ec4899' }}>10</span>
							<span style={{ color: '#6b7280' }}>)</span>
							<span style={{ color: '#6b7280', marginLeft: '12px' }}>// Enable SMS at 10%</span>
						</div>
						<div>
							<span style={{ color: '#10b981' }}>window.mfaHelpers</span>
							<span style={{ color: '#6b7280' }}>.disable(</span>
							<span style={{ color: '#f59e0b' }}>"SMS"</span>
							<span style={{ color: '#6b7280' }}>)</span>
							<span style={{ color: '#6b7280', marginLeft: '12px' }}>// Instant rollback</span>
						</div>
						<div>
							<span style={{ color: '#10b981' }}>window.mfaHelpers</span>
							<span style={{ color: '#6b7280' }}>.status()</span>
							<span style={{ color: '#6b7280', marginLeft: '12px' }}>// Show formatted table</span>
						</div>
						<div>
							<span style={{ color: '#10b981' }}>window.mfaHelpers</span>
							<span style={{ color: '#6b7280' }}>.enableAll(</span>
							<span style={{ color: '#ec4899' }}>50</span>
							<span style={{ color: '#6b7280' }}>)</span>
							<span style={{ color: '#6b7280', marginLeft: '12px' }}>// Enable all at 50%</span>
						</div>
						<div>
							<span style={{ color: '#10b981' }}>window.mfaHelpers</span>
							<span style={{ color: '#6b7280' }}>.disableAll()</span>
							<span style={{ color: '#6b7280', marginLeft: '12px' }}>// Emergency rollback</span>
						</div>
					</div>

					<div style={{ marginBottom: '8px', fontWeight: '600', color: '#9ca3af' }}>
						Legacy Commands (still supported):
					</div>
					<div style={{ lineHeight: '1.8', opacity: 0.7 }}>
						<div>
							<span style={{ color: '#10b981' }}>window.mfaFlags</span>
							<span style={{ color: '#6b7280' }}>.setFlag(</span>
							<span style={{ color: '#f59e0b' }}>"mfa_unified_sms"</span>
							<span style={{ color: '#6b7280' }}>, </span>
							<span style={{ color: '#3b82f6' }}>true</span>
							<span style={{ color: '#6b7280' }}>, </span>
							<span style={{ color: '#ec4899' }}>10</span>
							<span style={{ color: '#6b7280' }}>)</span>
						</div>
						<div>
							<span style={{ color: '#10b981' }}>window.mfaFlags</span>
							<span style={{ color: '#6b7280' }}>.getFlagsSummary()</span>
						</div>
					</div>
				</div>

				{/* Bulk Operations */}
				<div
					style={{
						background: 'white',
						borderRadius: '8px',
						padding: '24px',
						marginBottom: '24px',
						boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
					}}
				>
					<h3
						style={{
							fontSize: '18px',
							fontWeight: '600',
							color: '#111827',
							marginTop: 0,
							marginBottom: '12px',
						}}
					>
						Bulk Operations
					</h3>
					<p style={{ fontSize: '14px', color: '#6b7280', marginTop: 0, marginBottom: '16px' }}>
						Apply rollout settings to all device types at once for faster deployment management.
					</p>
					<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
						<button
							type="button"
							onClick={() => handleEnableAll(10)}
							style={{
								padding: '10px 20px',
								border: '1px solid #10b981',
								borderRadius: '6px',
								background: '#f0fdf4',
								color: '#065f46',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								transition: 'all 0.2s',
							}}
						>
							Enable All at 10% (Pilot)
						</button>

						<button
							type="button"
							onClick={() => handleEnableAll(50)}
							style={{
								padding: '10px 20px',
								border: '1px solid #3b82f6',
								borderRadius: '6px',
								background: '#eff6ff',
								color: '#1e40af',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								transition: 'all 0.2s',
							}}
						>
							Enable All at 50% (Expansion)
						</button>

						<button
							type="button"
							onClick={() => handleEnableAll(100)}
							style={{
								padding: '10px 20px',
								border: '1px solid #8b5cf6',
								borderRadius: '6px',
								background: '#f5f3ff',
								color: '#6d28d9',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								transition: 'all 0.2s',
							}}
						>
							Enable All at 100% (Full Rollout)
						</button>

						<button
							type="button"
							onClick={handleDisableAll}
							style={{
								padding: '10px 20px',
								border: '1px solid #dc2626',
								borderRadius: '6px',
								background: '#fef2f2',
								color: '#dc2626',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								transition: 'all 0.2s',
							}}
						>
							🚨 Emergency Rollback (Disable All)
						</button>
					</div>
				</div>

				{/* Feature Flags Grid */}
				<div style={{ display: 'grid', gap: '16px' }}>
					{summary.map((item) => {
						const state = flags[item.flag];
						const isApplied = item.appliesTo === 'THIS USER';

						return (
							<div
								key={item.flag}
								style={{
									background: 'white',
									borderRadius: '8px',
									padding: '24px',
									boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
									border: isApplied ? '2px solid #10b981' : '1px solid #e5e7eb',
								}}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										marginBottom: '16px',
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
										<h3
											style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}
										>
											{item.flag.replace('mfa_unified_', '').toUpperCase()}
										</h3>
										{isApplied && (
											<span
												style={{
													padding: '4px 12px',
													background: '#d1fae5',
													color: '#065f46',
													borderRadius: '12px',
													fontSize: '12px',
													fontWeight: '600',
												}}
											>
												ACTIVE FOR YOU
											</span>
										)}
									</div>

									{/* Toggle Button */}
									<button
										type="button"
										onClick={() => toggleFlag(item.flag)}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											padding: '10px 20px',
											border: 'none',
											borderRadius: '6px',
											background: state.enabled ? '#10b981' : '#9ca3af',
											color: 'white',
											fontSize: '14px',
											fontWeight: '600',
											cursor: 'pointer',
											transition: 'all 0.2s',
										}}
									>
										{state.enabled ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
										{state.enabled ? 'ENABLED' : 'DISABLED'}
									</button>
								</div>

								{/* Rollout Percentage */}
								<div style={{ marginBottom: '16px' }}>
									<div
										style={{
											marginBottom: '8px',
											fontSize: '14px',
											fontWeight: '600',
											color: '#374151',
										}}
									>
										Rollout Percentage
									</div>
									<div style={{ display: 'flex', gap: '8px' }}>
										{[0, 10, 50, 100].map((pct) => (
											<button
												type="button"
												key={pct}
												onClick={() => setRollout(item.flag, pct as RolloutPercentage)}
												disabled={!state.enabled}
												style={{
													flex: 1,
													padding: '12px',
													border:
														state.rolloutPercentage === pct
															? '2px solid #3b82f6'
															: '1px solid #d1d5db',
													borderRadius: '6px',
													background: state.rolloutPercentage === pct ? '#eff6ff' : 'white',
													color: state.rolloutPercentage === pct ? '#1e40af' : '#6b7280',
													fontSize: '16px',
													fontWeight: state.rolloutPercentage === pct ? '700' : '600',
													cursor: state.enabled ? 'pointer' : 'not-allowed',
													opacity: state.enabled ? 1 : 0.5,
													transition: 'all 0.2s',
												}}
											>
												{pct}%
											</button>
										))}
									</div>
								</div>

								{/* Status */}
								<div
									style={{
										padding: '12px',
										background: '#f9fafb',
										borderRadius: '6px',
										fontSize: '13px',
										color: '#6b7280',
									}}
								>
									<div style={{ marginBottom: '4px' }}>
										<strong>Status:</strong>{' '}
										{state.enabled ? `Enabled at ${state.rolloutPercentage}%` : 'Disabled'}
									</div>
									<div>
										<strong>Last Updated:</strong> {new Date(state.lastUpdated).toLocaleString()}
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* Actions */}
				<div
					style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}
				>
					<button
						type="button"
						onClick={refreshFlags}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							padding: '12px 24px',
							border: '1px solid #d1d5db',
							borderRadius: '6px',
							background: 'white',
							color: '#374151',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						<FiRefreshCw size={18} />
						Refresh
					</button>

					<button
						type="button"
						onClick={resetAll}
						style={{
							padding: '12px 24px',
							border: '1px solid #dc2626',
							borderRadius: '6px',
							background: '#fef2f2',
							color: '#dc2626',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						Reset All Flags
					</button>
				</div>
			</div>
		</div>
	);
};
