/**
 * @file MfaRedirectDebugPanel.tsx
 * @module v8/components
 * @description Debug panel for MFA redirect URI issues
 * @version 8.0.0
 */

import React, { useEffect, useState } from 'react';
import { MFARedirectUriServiceV8 } from '@/v8/services/mfaRedirectUriServiceV8';

interface DebugPanelProps {
	visible: boolean;
	onClose: () => void;
}

/**
 * Debug panel for MFA redirect URI troubleshooting
 */
export const MfaRedirectDebugPanel: React.FC<DebugPanelProps> = ({ visible, onClose }) => {
	const [logs, setLogs] = useState<string>('');
	const [autoRefresh, setAutoRefresh] = useState(true);

	useEffect(() => {
		if (visible) {
			refreshLogs();
		}
	}, [visible, refreshLogs]);

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (visible && autoRefresh) {
			interval = setInterval(refreshLogs, 1000);
		}
		return () => {
			if (interval) clearInterval(interval);
		};
	}, [visible, autoRefresh, refreshLogs]);

	const refreshLogs = () => {
		setLogs(MFARedirectUriServiceV8.getDebugLogs());
	};

	const clearLogs = () => {
		MFARedirectUriServiceV8.clearDebugLogs();
		refreshLogs();
	};

	const exportLogs = () => {
		MFARedirectUriServiceV8.exportDebugLogs();
	};

	if (!visible) return null;

	return (
		<div
			style={{
				position: 'fixed',
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
				background: 'white',
				border: '2px solid #333',
				borderRadius: '8px',
				padding: '20px',
				maxWidth: '80vw',
				maxHeight: '80vh',
				zIndex: 10000,
				boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '15px',
					paddingBottom: '10px',
					borderBottom: '1px solid #ddd',
				}}
			>
				<h3 style={{ margin: 0, fontSize: '18px' }}>🔗 MFA Redirect URI Debug Logs</h3>
				<button
					onClick={onClose}
					style={{
						background: 'none',
						border: 'none',
						fontSize: '20px',
						cursor: 'pointer',
						padding: '0',
						width: '30px',
						height: '30px',
					}}
				>
					×
				</button>
			</div>

			<div
				style={{
					display: 'flex',
					gap: '10px',
					marginBottom: '15px',
					flexWrap: 'wrap',
				}}
			>
				<button
					onClick={refreshLogs}
					style={{
						padding: '6px 12px',
						background: '#007bff',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
						fontSize: '12px',
					}}
				>
					🔄 Refresh
				</button>

				<label style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
					<input
						type="checkbox"
						checked={autoRefresh}
						onChange={(e) => setAutoRefresh(e.target.checked)}
						style={{ marginRight: '5px' }}
					/>
					Auto-refresh
				</label>

				<button
					onClick={clearLogs}
					style={{
						padding: '6px 12px',
						background: '#dc3545',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
						fontSize: '12px',
					}}
				>
					🗑️ Clear
				</button>

				<button
					onClick={exportLogs}
					style={{
						padding: '6px 12px',
						background: '#28a745',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
						fontSize: '12px',
					}}
				>
					📥 Export
				</button>
			</div>

			<div
				style={{
					background: '#f8f9fa',
					border: '1px solid #dee2e6',
					borderRadius: '4px',
					padding: '10px',
					fontFamily: 'monospace',
					fontSize: '11px',
					whiteSpace: 'pre-wrap',
					overflow: 'auto',
					maxHeight: '50vh',
					minHeight: '200px',
				}}
			>
				{logs || 'No debug logs available. Navigate through MFA flows to generate logs.'}
			</div>

			<div
				style={{
					marginTop: '10px',
					fontSize: '11px',
					color: '#666',
				}}
			>
				💡 Tip: Logs persist across redirects. Check here after OAuth callbacks to see what
				happened.
			</div>
		</div>
	);
};

/**
 * Hook to show/hide the debug panel
 */
export const useMfaRedirectDebug = () => {
	const [visible, setVisible] = useState(false);

	const showDebug = () => setVisible(true);
	const hideDebug = () => setVisible(false);

	return {
		visible,
		showDebug,
		hideDebug,
		DebugPanel: () => <MfaRedirectDebugPanel visible={visible} onClose={hideDebug} />,
	};
};
