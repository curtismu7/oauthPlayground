/**
 * @file UnifiedMFATabsV8.tsx
 * @module v8/components
 * @description Tab-based navigation component for Unified MFA
 * @version 8.0.0
 * @since 2025-01-20
 */

import React, { useEffect, useState } from 'react';
import { unifiedLoggerV8, type UnifiedLogEntry } from '../services/unifiedLoggerV8';
import { type UnifiedMFAStateData, unifiedStateServiceV8 } from '../services/unifiedStateServiceV8';
import { workerTokenServiceV8 } from '../services/workerTokenServiceV8';

interface UnifiedMFATabsV8Props {
	currentState: UnifiedMFAStateData;
	runId: string | null;
	onTabChange: (tab: string) => void;
	onCancel: () => void;
	onReset: () => void;
}

export const UnifiedMFATabsV8: React.FC<UnifiedMFATabsV8Props> = ({
	currentState,
	runId,
	onTabChange,
	onCancel,
	onReset,
}) => {
	const [activeTab, setActiveTab] = useState('config');
	const [workerTokenStatus, setWorkerTokenStatus] = useState<
		'loading' | 'valid' | 'expired' | 'missing'
	>('loading');

	// Get valid tabs for current state
	const getValidTabsForState = (state: UnifiedMFAStateData['state']): string[] => {
		switch (state) {
			case 'INIT':
				return ['config'];
			case 'CONFIG':
				return ['config', 'register', 'docs'];
			case 'DEVICE_DISCOVERY':
				return ['register', 'docs'];
			case 'AUTH_INIT':
			case 'AUTH_VERIFY':
				return ['register', 'docs'];
			case 'SUCCESS':
				return ['success', 'docs'];
			case 'ERROR':
				return ['config', 'docs'];
			default:
				return ['config', 'docs'];
		}
	};

	const validTabs = getValidTabsForState(currentState.state);

	// Check worker token status
	useEffect(() => {
		const checkWorkerToken = async () => {
			try {
				const credentials = await workerTokenServiceV8.loadCredentials();
				const token = await workerTokenServiceV8.getToken();

				if (!credentials || !token) {
					setWorkerTokenStatus('missing');
				} else if (workerTokenServiceV8.isTokenExpired()) {
					setWorkerTokenStatus('expired');
				} else {
					setWorkerTokenStatus('valid');
				}
			} catch (error) {
				setWorkerTokenStatus('missing');
			}
		};

		checkWorkerToken();
	}, [currentState]);

	// Set initial tab from URL
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const tabFromUrl = urlParams.get('tab');
		if (tabFromUrl && validTabs.includes(tabFromUrl)) {
			setActiveTab(tabFromUrl);
		} else {
			setActiveTab(validTabs[0]);
		}
	}, [validTabs]);

	// Handle tab click
	const handleTabClick = async (tab: string) => {
		if (!validTabs.includes(tab)) {
			return;
		}

		setActiveTab(tab);
		onTabChange(tab);

		// Log tab change
		await unifiedLoggerV8.logClientEvent({
			transactionId: currentState.transactionId,
			type: 'user_action',
			data: {
				action: 'tab_clicked',
				tab,
				state: currentState.state,
			},
		});
	};

	// Render tab content
	const renderTabContent = () => {
		switch (activeTab) {
			case 'config':
				return <ConfigTab currentState={currentState} runId={runId} />;
			case 'register':
				return <RegisterTab currentState={currentState} runId={runId} />;
			case 'docs':
				return <DocsTab currentState={currentState} runId={runId} />;
			case 'success':
				return <SuccessTab currentState={currentState} runId={runId} />;
			default:
				return <ConfigTab currentState={currentState} runId={runId} />;
		}
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
			{/* Tab Navigation */}
			<div
				style={{
					display: 'flex',
					borderBottom: '1px solid #e2e8f0',
					position: 'relative',
				}}
			>
				{validTabs.map((tab) => (
					<button
						key={tab}
						type="button"
						onClick={() => handleTabClick(tab)}
						style={{
							padding: '12px 24px',
							backgroundColor: 'transparent',
							border: 'none',
							borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
							color: activeTab === tab ? '#3b82f6' : '#64748b',
							fontWeight: activeTab === tab ? '600' : '500',
							cursor: 'pointer',
							fontSize: '14px',
							transition: 'all 0.2s ease',
							position: 'relative',
							zIndex: 1,
						}}
						onMouseEnter={(e) => {
							if (activeTab !== tab) {
								e.currentTarget.style.backgroundColor = '#f8fafc';
							}
						}}
						onMouseLeave={(e) => {
							if (activeTab !== tab) {
								e.currentTarget.style.backgroundColor = 'transparent';
							}
						}}
					>
						{getTabLabel(tab)}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div
				style={{
					minHeight: '400px',
					backgroundColor: 'white',
					borderRadius: '8px',
					border: '1px solid #e2e8f0',
					padding: '24px',
				}}
			>
				{renderTabContent()}
			</div>
		</div>
	);
};

// Tab label helper
const getTabLabel = (tab: string): string => {
	switch (tab) {
		case 'config':
			return 'Configuration';
		case 'register':
			return 'Registration';
		case 'docs':
			return 'API Docs';
		case 'success':
			return 'Success';
		default:
			return tab;
	}
};

// Config Tab Component
const ConfigTab: React.FC<{ currentState: UnifiedMFAStateData; runId: string | null }> = ({
	currentState,
	runId,
}) => {
	const [workerTokenStatus, setWorkerTokenStatus] = useState<
		'loading' | 'valid' | 'expired' | 'missing'
	>('loading');
	const [showTokenModal, setShowTokenModal] = useState(false);

	useEffect(() => {
		const checkStatus = async () => {
			const credentials = await workerTokenServiceV8.loadCredentials();
			const token = await workerTokenServiceV8.getToken();

			if (!credentials || !token) {
				setWorkerTokenStatus('missing');
			} else if (workerTokenServiceV8.isTokenExpired()) {
				setWorkerTokenStatus('expired');
			} else {
				setWorkerTokenStatus('valid');
			}
		};

		checkStatus();
	}, []);

	const handleGetWorkerToken = async () => {
		setShowTokenModal(true);

		await unifiedLoggerV8.logClientEvent({
			transactionId: currentState.transactionId,
			type: 'user_action',
			data: {
				action: 'get_worker_token_clicked',
				state: currentState.state,
			},
		});
	};

	const handleClearData = async () => {
		if (window.confirm('Are you sure you want to clear all MFA data?')) {
			await workerTokenServiceV8.clearCredentials();
			await unifiedStateServiceV8.clearState();

			await unifiedLoggerV8.logClientEvent({
				transactionId: currentState.transactionId,
				type: 'user_action',
				data: {
					action: 'clear_all_data',
					state: currentState.state,
				},
			});

			window.location.reload();
		}
	};

	const getStatusColor = () => {
		switch (workerTokenStatus) {
			case 'valid':
				return '#10b981';
			case 'expired':
				return '#f59e0b';
			case 'missing':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	};

	const getStatusText = () => {
		switch (workerTokenStatus) {
			case 'valid':
				return 'Worker Token Valid';
			case 'expired':
				return 'Worker Token Expired';
			case 'missing':
				return 'No Worker Token';
			default:
				return 'Checking...';
		}
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
			<div>
				<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
					Configuration
				</h2>
				<p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
					Configure your PingOne environment and worker token for MFA operations.
				</p>
			</div>

			{/* Worker Token Status */}
			<div
				style={{
					padding: '16px',
					backgroundColor: '#f8fafc',
					borderRadius: '8px',
					border: '1px solid #e2e8f0',
				}}
			>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<div>
						<div style={{ fontWeight: '500', marginBottom: '4px' }}>Worker Token Status</div>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								color: getStatusColor(),
							}}
						>
							<div
								style={{
									width: '8px',
									height: '8px',
									borderRadius: '50%',
									backgroundColor: getStatusColor(),
								}}
							/>
							{getStatusText()}
						</div>
					</div>

					{workerTokenStatus !== 'valid' && (
						<button
							type="button"
							onClick={handleGetWorkerToken}
							style={{
								padding: '8px 16px',
								backgroundColor: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '14px',
							}}
						>
							Get Worker Token
						</button>
					)}
				</div>
			</div>

			{/* Environment Info */}
			<div
				style={{
					padding: '16px',
					backgroundColor: '#f8fafc',
					borderRadius: '8px',
					border: '1px solid #e2e8f0',
				}}
			>
				<div style={{ fontWeight: '500', marginBottom: '8px' }}>Environment</div>
				<div style={{ fontSize: '14px', color: '#64748b' }}>
					<div>Environment ID: {currentState.envId}</div>
					<div>Run ID: {runId}</div>
					<div>Current State: {currentState.state}</div>
				</div>
			</div>

			{/* Actions */}
			<div style={{ display: 'flex', gap: '12px' }}>
				<button
					type="button"
					onClick={handleClearData}
					style={{
						padding: '8px 16px',
						backgroundColor: '#ef4444',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
						fontSize: '14px',
					}}
				>
					Clear All Data
				</button>
			</div>

			{/* Token Modal Placeholder */}
			{showTokenModal && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						zIndex: 1000,
					}}
				>
					<div
						style={{
							backgroundColor: 'white',
							padding: '24px',
							borderRadius: '8px',
							maxWidth: '400px',
							width: '90%',
						}}
					>
						<h3 style={{ margin: 0, marginBottom: '16px' }}>Worker Token Modal</h3>
						<p style={{ margin: 0, marginBottom: '16px', color: '#64748b' }}>
							Worker token modal would be implemented here.
						</p>
						<button
							type="button"
							onClick={() => setShowTokenModal(false)}
							style={{
								padding: '8px 16px',
								backgroundColor: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

// Register Tab Component
const RegisterTab: React.FC<{ currentState: UnifiedMFAStateData; runId: string | null }> = ({
	currentState,
	runId,
}) => {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
			<div>
				<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
					Device Registration
				</h2>
				<p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
					Register and manage MFA devices for your account.
				</p>
			</div>

			<div
				style={{
					padding: '32px',
					textAlign: 'center',
					backgroundColor: '#f8fafc',
					borderRadius: '8px',
					border: '1px solid #e2e8f0',
				}}
			>
				<div style={{ fontSize: '16px', color: '#64748b', marginBottom: '16px' }}>
					Device registration interface would be implemented here.
				</div>
				<div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
					Current state: {currentState.state}
				</div>
			</div>
		</div>
	);
};

// Docs Tab Component
const DocsTab: React.FC<{ currentState: UnifiedMFAStateData; runId: string | null }> = ({
	currentState,
	runId,
}) => {
	const [logs, setLogs] = useState<UnifiedLogEntry[]>([]);

	useEffect(() => {
		const loadLogs = async () => {
			if (runId) {
				const logData = await unifiedLoggerV8.getLogs(runId);
				setLogs(logData);
			}
		};

		loadLogs();
	}, [runId]);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
			<div>
				<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
					API Documentation & Logs
				</h2>
				<p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
					View API calls and client events for this session.
				</p>
			</div>

			<div
				style={{
					padding: '16px',
					backgroundColor: '#f8fafc',
					borderRadius: '8px',
					border: '1px solid #e2e8f0',
				}}
			>
				<div style={{ fontWeight: '500', marginBottom: '12px' }}>
					Session Logs ({logs.length} entries)
				</div>

				{logs.length === 0 ? (
					<div style={{ color: '#64748b', fontSize: '14px' }}>No logs available yet.</div>
				) : (
					<div
						style={{
							maxHeight: '300px',
							overflowY: 'auto',
							fontFamily: 'monospace',
							fontSize: '12px',
							lineHeight: '1.5',
						}}
					>
						{logs.map((log, index) => (
							<div
								key={index}
								style={{
									marginBottom: '8px',
									padding: '8px',
									backgroundColor: 'white',
									borderRadius: '4px',
									border: '1px solid #e2e8f0',
								}}
							>
								<div style={{ color: '#3b82f6', fontWeight: '500' }}>
									{log.type.toUpperCase()} - {new Date(log.timestamp).toISOString()}
								</div>
								<div style={{ color: '#64748b' }}>{JSON.stringify(log.data, null, 2)}</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

// Success Tab Component
const SuccessTab: React.FC<{ currentState: UnifiedMFAStateData; runId: string | null }> = ({
	currentState,
	runId,
}) => {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
			<div>
				<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
					MFA Setup Complete
				</h2>
				<p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
					Your MFA device has been successfully registered.
				</p>
			</div>

			<div
				style={{
					padding: '32px',
					textAlign: 'center',
					backgroundColor: '#f0fdf4',
					borderRadius: '8px',
					border: '1px solid #bbf7d0',
				}}
			>
				<div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
				<div style={{ fontSize: '18px', fontWeight: '500', color: '#16a34a', marginBottom: '8px' }}>
					Success!
				</div>
				<div style={{ color: '#16a34a', fontSize: '14px' }}>MFA flow completed successfully.</div>
			</div>
		</div>
	);
};

export default UnifiedMFATabsV8;
