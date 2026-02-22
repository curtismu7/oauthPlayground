/**
 * @file MFAFeatureFlagsAdminV8.tsx
 * @module v8/pages
 * @description Admin UI for managing MFA feature flags
 * @version 8.0.0
 * @since 2026-01-29
 */

import React, { useCallback, useEffect, useState } from 'react';
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
		<div className="end-user-nano">
			<div style={{ minHeight: '100vh', background: '#f9fafb', padding: '32px 20px' }}>
				{/* Header */}
				<div className="container">
					<div className="card ping-header">
						<div className="d-flex justify-content-between align-items-center mb-3">
							<div className="d-flex align-items-center gap-3">
								<span className="mdi mdi-flag" style={{ fontSize: '32px', color: 'white' }}></span>
								<div className="d-flex align-items-center gap-2">
									<h1 className="mb-0 h1 fw-bold text-white">MFA Feature Flags Admin</h1>
									{isUpdating && (
										<span className="badge bg-secondary bg-opacity-25 text-white small">
											Updating...
										</span>
									)}
								</div>
							</div>
							<button
								type="button"
								onClick={() => navigate('/v8/mfa-config')}
								className="btn btn-outline-light"
							>
								<span className="mdi mdi-arrow-left" style={{ fontSize: '16px' }}></span>
								Back to MFA Hub
							</button>
						</div>
						<p className="mb-0 fs-5 text-white opacity-90">
							Control gradual rollout of unified MFA flows (Phase 8 - Week 7-8)
						</p>
					</div>

					{/* Info Panel */}
					<div className="alert alert-info d-flex align-items-start gap-3 mb-4">
						<span className="mdi mdi-information-outline fs-4 mt-n1"></span>
						<div>
							<h3 className="h6 fw-bold text-primary mb-2">How Feature Flags Work</h3>
							<ul className="mb-0 ps-3 fs-6 text-primary-emphasis lh-lg">
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

					{/* Console Commands */}
					<div className="card bg-dark text-light mb-4">
						<div className="card-body">
							<h5 className="card-title fw-bold text-success mb-3">
								Phase 8 Helper Commands (Recommended):
							</h5>
							<div className="font-monospace small lh-lg mb-4">
								<div>
									<span className="text-success">window.mfaHelpers</span>
									<span className="text-muted">.enable(</span>
									<span className="text-warning">"SMS"</span>
									<span className="text-muted">, </span>
									<span className="text-info">10</span>
									<span className="text-muted">)</span>
									<span className="text-muted ms-3">{/* Enable SMS at 10% */}</span>
								</div>
								<div>
									<span className="text-success">window.mfaHelpers</span>
									<span className="text-muted">.disable(</span>
									<span className="text-warning">"SMS"</span>
									<span className="text-muted">)</span>
									<span className="text-muted ms-3">{/* Instant rollback */}</span>
								</div>
								<div>
									<span className="text-success">window.mfaHelpers</span>
									<span className="text-muted">.status()</span>
									<span className="text-muted ms-3">{/* Show formatted table */}</span>
								</div>
								<div>
									<span className="text-success">window.mfaHelpers</span>
									<span className="text-muted">.enableAll(</span>
									<span className="text-info">50</span>
									<span className="text-muted">)</span>
									<span className="text-muted ms-3">{/* Enable all at 50% */}</span>
								</div>
								<div>
									<span className="text-success">window.mfaHelpers</span>
									<span className="text-muted">.disableAll()</span>
									<span className="text-muted ms-3">{/* Emergency rollback */}</span>
								</div>
							</div>

							<h6 className="card-subtitle text-secondary mb-2">
								Legacy Commands (still supported):
							</h6>
							<div className="font-monospace small lh-lg opacity-75">
								<div>
									<span className="text-success">window.mfaFlags</span>
									<span className="text-muted">.setFlag(</span>
									<span className="text-warning">"mfa_unified_sms"</span>
									<span className="text-muted">, </span>
									<span className="text-primary">true</span>
									<span className="text-muted">, </span>
									<span className="text-info">10</span>
									<span className="text-muted">)</span>
								</div>
								<div>
									<span className="text-success">window.mfaFlags</span>
									<span className="text-muted">.getFlagsSummary()</span>
								</div>
							</div>
						</div>
					</div>

					{/* Bulk Operations */}
					<div className="card mb-4">
						<div className="card-body">
							<h3 className="card-title h5 fw-bold mb-2">Bulk Operations</h3>
							<p className="text-muted small mb-3">
								Apply rollout settings to all device types at once for faster deployment management.
							</p>
							<div className="d-flex gap-2 flex-wrap">
								<button
									type="button"
									onClick={() => handleEnableAll(10)}
									className="btn btn-outline-success"
								>
									Enable All at 10% (Pilot)
								</button>

								<button
									type="button"
									onClick={() => handleEnableAll(50)}
									className="btn btn-outline-primary"
								>
									Enable All at 50% (Expansion)
								</button>

								<button
									type="button"
									onClick={() => handleEnableAll(100)}
									className="btn btn-outline-purple"
								>
									Enable All at 100% (Full Rollout)
								</button>

								<button type="button" onClick={handleDisableAll} className="btn btn-outline-danger">
									🚨 Emergency Rollback (Disable All)
								</button>
							</div>
						</div>
					</div>

					{/* Feature Flags Grid */}
					<div className="row g-3">
						{summary.map((item) => {
							const state = flags[item.flag];
							const isApplied = item.appliesTo === 'THIS USER';

							return (
								<div key={item.flag} className="col-12">
									<div className={`card ${isApplied ? 'border-success border-2' : 'border-1'}`}>
										<div className="card-body">
											<div className="d-flex justify-content-between align-items-center mb-3">
												<div className="d-flex align-items-center gap-3">
													<h3 className="card-title h5 fw-bold mb-0">
														{item.flag.replace('mfa_unified_', '').toUpperCase()}
													</h3>
													{isApplied && (
														<span className="badge bg-success bg-opacity-10 text-success small fw-semibold">
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
													{state.enabled ? (
														<span
															className="mdi mdi-toggle-switch"
															style={{ fontSize: '20px' }}
														></span>
													) : (
														<span
															className="mdi mdi-toggle-switch-off"
															style={{ fontSize: '20px' }}
														></span>
													)}
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
													<strong>Last Updated:</strong>{' '}
													{new Date(state.lastUpdated).toLocaleString()}
												</div>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{/* Actions */}
					<div className="d-flex gap-2 justify-content-end mt-4">
						<button
							type="button"
							onClick={refreshFlags}
							className="btn btn-outline-secondary d-flex align-items-center gap-2"
						>
							<span className="mdi mdi-refresh" style={{ fontSize: '18px' }}></span>
							Refresh
						</button>

						<button type="button" onClick={resetAll} className="btn btn-outline-danger">
							Reset All Flags
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
