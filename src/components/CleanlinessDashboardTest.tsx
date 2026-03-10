import React from 'react';

const CleanlinessDashboardTest: React.FC = () => {
	return (
		<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
			<h1>🧹 Cleanliness Dashboard - Test Version</h1>
			<p>This is a minimal test version to verify the route works.</p>
			<div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
				<h2>✅ Route Working!</h2>
				<p>If you can see this page, the /cleanliness-dashboard route is properly configured.</p>
			</div>
		</div>
	);
};

export { CleanlinessDashboardTest };
