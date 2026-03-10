import React from 'react';

const CleanlinessDashboardMinimal: React.FC = () => {
	return (
		<div
			style={{
				padding: '20px',
				fontFamily: 'Arial, sans-serif',
				background: '#1a1a1a',
				color: '#00ff00',
				minHeight: '100vh',
			}}
		>
			<h1>🧹 Cleanliness Dashboard - Minimal Version</h1>
			<p>This is a minimal test version to verify the route works.</p>
			<div
				style={{
					background: '#333333',
					padding: '10px',
					borderRadius: '5px',
					marginTop: '20px',
				}}
			>
				<h2>✅ Route Working!</h2>
				<p>If you can see this page, the /cleanliness-dashboard route is properly configured.</p>
				<p>The full component may have dependency issues that need to be resolved.</p>
			</div>
		</div>
	);
};

export { CleanlinessDashboardMinimal };
