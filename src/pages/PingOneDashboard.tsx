// src/pages/PingOneDashboard.tsx
// Combined PingOne Platform Dashboard - Audit Activities + Identity Metrics

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FlowHeader } from '../services/flowHeaderService';
import PingOneAuditActivities from './PingOneAuditActivities';
import PingOneIdentityMetrics from './PingOneIdentityMetrics';

type TabId = 'audit' | 'metrics';

const tabConfig: { id: TabId; label: string; icon: string }[] = [
	{ id: 'audit', label: 'Audit Activities', icon: 'bi-activity' },
	{ id: 'metrics', label: 'Identity Metrics', icon: 'bi-bar-chart-line' },
];

const PingOneDashboard: React.FC = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const tabParam = searchParams.get('tab') as TabId | null;
	const initialTab: TabId = tabParam === 'audit' || tabParam === 'metrics' ? tabParam : 'audit';
	const [activeTab, setActiveTab] = useState<TabId>(initialTab);
	const [updateMessage, setUpdateMessage] = useState<string | null>(null);

	useEffect(() => {
		const t = searchParams.get('tab') as TabId | null;
		if (t === 'audit' || t === 'metrics') setActiveTab(t);
	}, [searchParams]);

	// Show "Dashboard updated" when dashboard is ready (on mount)
	useEffect(() => {
		setUpdateMessage('Dashboard updated');
		const t = setTimeout(() => setUpdateMessage(null), 4000);
		return () => clearTimeout(t);
	}, []);

	const handleTabChange = (tab: TabId) => {
		setActiveTab(tab);
		setSearchParams({ tab }, { replace: true });
	};

	return (
		<>
			<FlowHeader flowId="pingone-dashboard" />
			<div
				style={{
					maxWidth: '90rem',
					margin: '0 auto',
					padding: '2rem 1.5rem 4rem',
					display: 'flex',
					flexDirection: 'column',
					gap: '1.5rem',
					width: '100%',
				}}
			>
				{updateMessage && (
					<p
						style={{
							margin: 0,
							fontSize: '0.875rem',
							color: '#059669',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}
						role="status"
					>
						<i className="bi bi-check-circle-fill" aria-hidden />
						{updateMessage}
					</p>
				)}

				<div
					style={{
						display: 'flex',
						gap: '0.5rem',
						borderBottom: '2px solid #e5e7eb',
						paddingBottom: 0,
						marginBottom: '0.5rem',
					}}
				>
					{tabConfig.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => handleTabChange(tab.id)}
							style={{
								background: 'none',
								border: 'none',
								color: activeTab === tab.id ? '#dc2626' : '#6b7280',
								padding: '1rem 1.5rem',
								fontSize: '1rem',
								fontWeight: activeTab === tab.id ? 600 : 400,
								cursor: 'pointer',
								borderBottom: activeTab === tab.id ? '2px solid #dc2626' : '2px solid transparent',
								marginBottom: -2,
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								transition: 'color 0.2s, border-color 0.2s',
							}}
						>
							<i className={`bi ${tab.icon}`} />
							{tab.label}
						</button>
					))}
				</div>

				<div style={{ minHeight: '400px' }}>
					{activeTab === 'audit' && <PingOneAuditActivities embedded />}
					{activeTab === 'metrics' && <PingOneIdentityMetrics embedded />}
				</div>
			</div>
		</>
	);
};

export default PingOneDashboard;
