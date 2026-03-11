// src/v7/pages/V7MSettingsV9.tsx

import React, { useEffect, useState } from 'react';
import { isV7MEnabled, setV7MMode } from '../mode';

const V7MSettingsV9: React.FC = () => {
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
				<span>📦</span> Educational Mock Settings
			</h1>
			<p>Toggle Educational Mock Mode for mock flows.</p>
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
				<button type="button" onClick={handleToggle} style={btnStyle}>
					{enabled ? 'Disable' : 'Enable'} Mock Mode
				</button>
			</div>
			<div style={{ marginTop: 16, fontSize: 14, color: '#374151' }}>
				<p>
					When enabled, compatible flows can use simulators for authorization, token, UserInfo, and
					introspection operations.
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

export default V7MSettingsV9;
