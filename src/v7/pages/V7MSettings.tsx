// src/v7m/pages/V7MSettings.tsx
import React, { useEffect, useState } from 'react';
import { FiPackage } from '@icons';
import { isV7MEnabled, setV7MMode } from '../mode';

const V7MSettings: React.FC = () => {
	const [enabled, setEnabled] = useState<boolean>(isV7MEnabled());
	useEffect(() => {
		setEnabled(isV7MEnabled());
	}, []);

	function handleToggle() {
		const next = !enabled;
		setV7MMode(next ? 'on' : 'off');
		setEnabled(next);
	}

	return (
		<div style={{ padding: 24 }}>
			<h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
				<FiPackage /> V7M Settings
			</h1>
			<p>Toggle V7M Educational Mock Mode for V7 flows.</p>
			<div
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: 10,
					padding: 12,
					border: '1px solid #e5e7eb',
					borderRadius: 8,
				}}
			>
				<strong>Status:</strong>
				<span style={{ color: enabled ? '#16a34a' : '#ef4444' }}>
					{enabled ? 'Enabled' : 'Disabled'}
				</span>
				<button onClick={handleToggle} style={btnStyle}>
					{enabled ? 'Disable' : 'Enable'} V7M
				</button>
			</div>
			<div style={{ marginTop: 16, fontSize: 14, color: '#374151' }}>
				<p>
					When enabled, compatible V7 flows can use V7M simulators for authorization, token,
					UserInfo, and introspection operations.
				</p>
			</div>
		</div>
	);
};

const btnStyle: React.CSSProperties = {
	padding: '8px 12px',
	borderRadius: 6,
	border: '1px solid #94a3b8',
	background: '#fff',
	cursor: 'pointer',
};

export default V7MSettings;
