/**
 * @file MDIIconTest.tsx
 * @module components
 * @description Test component to verify MDI icons are loading properly
 * @version 1.0.0
 */

import React from 'react';
import MDIIcon from './MDIIcon';

/**
 * Test component to verify MDI icons are working
 * This can be used to debug icon loading issues
 */
const MDIIconTest: React.FC = () => {
	const testIcons = [
		{ name: 'home', label: 'Home' },
		{ name: 'settings', label: 'Settings' },
		{ name: 'key', label: 'Key' },
		{ name: 'shield-outline', label: 'Shield' },
		{ name: 'account', label: 'Account' },
		{ name: 'chevron-down', label: 'Chevron Down' },
		{ name: 'eye', label: 'Eye' },
		{ name: 'server', label: 'Server' },
		{ name: 'devices', label: 'Devices' },
		{ name: 'certificate', label: 'Certificate' },
	];

	return (
		<div style={{ padding: '20px', fontFamily: 'Inter, sans-serif' }}>
			<h3>MDI Icon Test - Verify Icons Load Properly</h3>
			<p>If you see icons below, MDI CSS is loading correctly:</p>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
					gap: '15px',
					marginTop: '20px',
				}}
			>
				{testIcons.map((icon) => (
					<div
						key={icon.name}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '10px',
							padding: '10px',
							border: '1px solid #e5e7eb',
							borderRadius: '8px',
							background: '#f9fafb',
						}}
					>
						<MDIIcon icon={icon.name} size={24} aria-label={icon.label} />
						<span style={{ fontSize: '14px', color: '#374151' }}>{icon.label}</span>
					</div>
				))}
			</div>

			<div
				style={{ marginTop: '20px', padding: '15px', background: '#fef3c7', borderRadius: '8px' }}
			>
				<strong>Debug Info:</strong>
				<ul style={{ margin: '10px 0 0 20px', color: '#92400e' }}>
					<li>MDI CSS should be loaded from index.html</li>
					<li>Icons use CSS classes: mdi mdi-icon-name</li>
					<li>If you see text instead of icons, MDI CSS is not loading</li>
				</ul>
			</div>
		</div>
	);
};

export default MDIIconTest;
