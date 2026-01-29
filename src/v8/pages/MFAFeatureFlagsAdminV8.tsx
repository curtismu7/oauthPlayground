/**
 * @file MFAFeatureFlagsAdminV8.tsx
 * @module v8/pages
 * @description Admin UI for managing MFA feature flags
 * @version 8.0.0
 * @since 2026-01-29
 */

import React, { useEffect, useState } from 'react';
import { FiFlag, FiRefreshCw, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { MFAFeatureFlagsV8, type MFAFeatureFlag, type RolloutPercentage } from '../services/mfaFeatureFlagsV8';

export const MFAFeatureFlagsAdminV8: React.FC = () => {
	const [flags, setFlags] = useState(MFAFeatureFlagsV8.getAllFlags());
	const [summary, setSummary] = useState(MFAFeatureFlagsV8.getFlagsSummary());

	const refreshFlags = () => {
		setFlags(MFAFeatureFlagsV8.getAllFlags());
		setSummary(MFAFeatureFlagsV8.getFlagsSummary());
	};

	useEffect(() => {
		refreshFlags();
	}, []);

	const toggleFlag = (flag: MFAFeatureFlag) => {
		const current = MFAFeatureFlagsV8.getFlagState(flag);
		MFAFeatureFlagsV8.setFlag(flag, !current.enabled, current.rolloutPercentage);
		refreshFlags();
	};

	const setRollout = (flag: MFAFeatureFlag, percentage: RolloutPercentage) => {
		const current = MFAFeatureFlagsV8.getFlagState(flag);
		MFAFeatureFlagsV8.setFlag(flag, current.enabled, percentage);
		refreshFlags();
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
					<div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
						<FiFlag size={32} color="white" />
						<h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'white' }}>
							MFA Feature Flags Admin
						</h1>
					</div>
					<p style={{ margin: 0, fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)' }}>
						Control gradual rollout of unified MFA flows (Phase 0 - Week 6-8)
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
							<h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1e40af' }}>
								How Feature Flags Work
							</h3>
							<ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#1e3a8a', lineHeight: '1.6' }}>
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
					<div style={{ marginBottom: '12px', fontWeight: '600', color: '#f3f4f6' }}>Browser Console Commands:</div>
					<div style={{ lineHeight: '1.8' }}>
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
							<span style={{ color: '#6b7280' }}>.isEnabled(</span>
							<span style={{ color: '#f59e0b' }}>"mfa_unified_sms"</span>
							<span style={{ color: '#6b7280' }}>)</span>
						</div>
						<div>
							<span style={{ color: '#10b981' }}>window.mfaFlags</span>
							<span style={{ color: '#6b7280' }}>.getFlagsSummary()</span>
						</div>
						<div>
							<span style={{ color: '#10b981' }}>window.mfaFlags</span>
							<span style={{ color: '#6b7280' }}>.resetAllFlags()</span>
						</div>
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
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
										<h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
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
									<div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
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
													border: state.rolloutPercentage === pct ? '2px solid #3b82f6' : '1px solid #d1d5db',
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
										<strong>Status:</strong> {state.enabled ? `Enabled at ${state.rolloutPercentage}%` : 'Disabled'}
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
				<div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
