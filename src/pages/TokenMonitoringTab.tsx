import React from 'react';
import TokenResponseBoxes from '../components/token/TokenResponseBoxes';

const TokenMonitoringTab: React.FC = () => {
	// Example tokens for demo purposes
	const tokens = {
		access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access-token-demo',
		id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.id-token-demo',
		refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token-demo',
	};

	return (
		<div style={{ padding: '2rem' }}>
			<h3 style={{ marginBottom: 16 }}>Token Monitoring</h3>
			<p style={{ color: '#6b7280', marginBottom: 24 }}>
				View and monitor your current tokens. Copy tokens for debugging or integration.
			</p>
			<TokenResponseBoxes tokens={tokens} />
		</div>
	);
};

export default TokenMonitoringTab;
